import mysql.connector
import sqlite3

# 配置
mysql_config = {
    'user': 'root',
    'password': 'pass2004',
    'host': 'localhost',
    'database': 'ds_data_test1',
}
sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\backups\initial_sqlite_seed.db'

def restore_height():
    try:
        # 1. 从 SQLite 读取数据
        print(f"Connecting to SQLite: {sqlite_file}")
        conn_sqlite = sqlite3.connect(sqlite_file)
        cur_sqlite = conn_sqlite.cursor()
        cur_sqlite.execute("SELECT id, name, height FROM user")
        rows = cur_sqlite.fetchall()
        print(f"Found {len(rows)} users in SQLite.")

        # 2. 连接 MySQL
        db_mysql = mysql.connector.connect(**mysql_config)
        cursor_mysql = db_mysql.cursor()

        # 3. 更新 MySQL
        update_count = 0
        for user_id, name, height in rows:
            if height is not None:
                cursor_mysql.execute(
                    "UPDATE user SET height = %s WHERE id = %s",
                    (height, user_id)
                )
                update_count += 1
        
        db_mysql.commit()
        print(f"Successfully restored height for {update_count} users in MySQL.")

        # 4. 验证部分数据
        cursor_mysql.execute("SELECT id, name, height FROM user WHERE height > 127 LIMIT 10")
        sample_rows = cursor_mysql.fetchall()
        print("\nMySQL Sample Data (height > 127):")
        for row in sample_rows:
            print(row)

        db_mysql.close()
        conn_sqlite.close()

    except Exception as e:
        print(f"Error during restoration: {e}")

if __name__ == "__main__":
    restore_height()
