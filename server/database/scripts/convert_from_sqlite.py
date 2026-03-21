import os
import sqlite3
import shutil
from sqlite3_to_mysql import SQLite3toMySQL

def convert_sqlite_to_mysql():
    # 原始 SQLite 文件路径 (已移动到 backups 目录)
    original_sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\backups\initial_sqlite_seed.db'
    # 临时副本路径
    temp_sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\scripts\data_temp.db'
    
    # 检查文件是否存在
    if not os.path.exists(original_sqlite_file):
        print(f"错误: 找不到文件 {original_sqlite_file}")
        return

    # MySQL 配置信息
    mysql_config = {
        'mysql_user': 'root',
        'mysql_password': 'pass2004',
        'mysql_host': 'localhost',
        'mysql_port': 3306,
        'mysql_database': 'ds_data_test1',
    }

    try:
        # Step 1: 清理 MySQL 目标数据库 (防止外键名冲突)
        print(f"正在清理 MySQL 数据库 {mysql_config['mysql_database']}...")
        import mysql.connector
        db = mysql.connector.connect(
            user=mysql_config['mysql_user'],
            password=mysql_config['mysql_password'],
            host=mysql_config['mysql_host'],
            database=mysql_config['mysql_database']
        )
        cursor = db.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = %s", (mysql_config['mysql_database'],))
        tables = cursor.fetchall()
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS `{table[0]}`; ")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        db.close()

        # Step 2: 创建副本
        print(f"创建临时副本以处理视图问题...")
        shutil.copy2(original_sqlite_file, temp_sqlite_file)

        # Step 3: 在副本中删除所有视图
        conn = sqlite3.connect(temp_sqlite_file)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='view'")
        views = cur.fetchall()
        for view in views:
            view_name = view[0]
            print(f"正在从临时副本中移除视图: {view_name}")
            cur.execute(f"DROP VIEW IF EXISTS [{view_name}]")
        conn.commit()
        conn.close()

        print(f"正在启动表数据迁移: {temp_sqlite_file} -> MySQL - {mysql_config['mysql_database']}")
        
        # Step 4: 初始化并执行转换
        converter = SQLite3toMySQL(
            sqlite_file=temp_sqlite_file,
            mysql_user=mysql_config['mysql_user'],
            mysql_password=mysql_config['mysql_password'],
            mysql_host=mysql_config['mysql_host'],
            mysql_port=mysql_config['mysql_port'],
            mysql_database=mysql_config['mysql_database']
        )
        
        converter.transfer()
        print("\n[成功] 数据库表和数据迁移完成！")
        
    except Exception as e:
        print(f"\n[失败] 迁移过程中出现错误: {e}")
    finally:
        # 强制清理连接对象，防止 WinError 32 占用
        if 'converter' in locals():
            del converter
        import gc
        gc.collect()
        
        # Step 5: 清理临时文件
        if os.path.exists(temp_sqlite_file):
            try:
                os.remove(temp_sqlite_file)
                print("临时文件已清理。")
            except Exception as cleanup_error:
                print(f"清理临时文件失败 (可能仍被占用): {cleanup_error}")

if __name__ == "__main__":
    convert_sqlite_to_mysql()
