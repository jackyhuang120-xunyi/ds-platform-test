import os
import sqlite3
import shutil
import mysql.connector
from sqlite3_to_mysql import SQLite3toMySQL

def deploy_and_fix_database():
    """
    一键部署数据库：
    1. 从 SQLite 迁移数据到 MySQL
    2. 自动修正表结构字段类型 (解决 TINYINT 截断问题)
    3. 自动从原始 SQLite 重新同步被截断的数据
    """
    # 配置
    original_sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\backups\initial_sqlite_seed.db'
    temp_sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\scripts\data_temp.db'
    
    mysql_config = {
        'user': 'root',
        'password': 'pass2004',
        'host': 'localhost',
        'port': 3306,
        'database': 'ds_data_test1',
    }

    try:
        # Step 1: 清理 MySQL 环境 (防止外键和残留)
        print(f"--- Step 1: 正在清理 MySQL 数据库 {mysql_config['database']} ---")
        db_mysql = mysql.connector.connect(**mysql_config)
        cursor_mysql = db_mysql.cursor()
        cursor_mysql.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor_mysql.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = %s", (mysql_config['database'],))
        for (table_name,) in cursor_mysql.fetchall():
            cursor_mysql.execute(f"DROP TABLE IF EXISTS `{table_name}`;")
        cursor_mysql.execute("SET FOREIGN_KEY_CHECKS = 1;")
        db_mysql.commit()

        # Step 2: 准备迁移副本 (移除视图等干扰项)
        print(f"--- Step 2: 准备 SQLite 副本 ---")
        shutil.copy2(original_sqlite_file, temp_sqlite_file)
        conn_sqlite = sqlite3.connect(temp_sqlite_file)
        cur_sqlite = conn_sqlite.cursor()
        cur_sqlite.execute("SELECT name FROM sqlite_master WHERE type='view'")
        for (view_name,) in cur_sqlite.fetchall():
            cur_sqlite.execute(f"DROP VIEW IF EXISTS [{view_name}]")
        conn_sqlite.commit()
        
        # Step 3: 执行核心迁移 (初步搬运数据)
        print(f"--- Step 3: 启动数据迁移 (SQLite -> MySQL) ---")
        converter = SQLite3toMySQL(
            sqlite_file=temp_sqlite_file,
            mysql_user=mysql_config['user'],
            mysql_password=mysql_config['password'],
            mysql_host=mysql_config['host'],
            mysql_port=mysql_config['port'],
            mysql_database=mysql_config['database']
        )
        converter.transfer()

        # Step 4: 自动修正 Schema (关键修复)
        print(f"--- Step 4: 自动应用 Schema 补丁 (修复 height 和 weight 类型) ---")
        # 修改为支持大数值和小数的类型
        schema_patches = [
            "ALTER TABLE user MODIFY COLUMN height SMALLINT COMMENT '身高(cm)'",
            "ALTER TABLE user MODIFY COLUMN weight FLOAT COMMENT '体重(kg)'"
        ]
        for sql in schema_patches:
            cursor_mysql.execute(sql)
        db_mysql.commit()

        # Step 5: 自动找回由于类型截断丢失的数据
        print(f"--- Step 5: 自动从 SQLite 重新同步被截断的数据 ---")
        # 从原始 SQLite (或者副本) 读取正确的身高和体重
        cur_sqlite.execute("SELECT id, height, weight FROM user")
        all_users = cur_sqlite.fetchall()
        
        update_count = 0
        for user_id, height, weight in all_users:
            cursor_mysql.execute(
                "UPDATE user SET height = %s, weight = %s WHERE id = %s", 
                (height, weight, user_id)
            )
            update_count += 1
        
        db_mysql.commit()
        print(f"成功恢复了 {update_count} 名用户的身高原始数据。")

        print("\n[部署成功] 您现在可以在这台电脑上正常使用数据库了！")

    except Exception as e:
        print(f"\n[部署失败] 过程中出现错误: {e}")
    finally:
        if 'db_mysql' in locals() and db_mysql.is_connected():
            db_mysql.close()
        if 'conn_sqlite' in locals():
            conn_sqlite.close()
        if os.path.exists(temp_sqlite_file):
            try:
                os.remove(temp_sqlite_file)
            except:
                pass

if __name__ == "__main__":
    deploy_and_fix_database()
