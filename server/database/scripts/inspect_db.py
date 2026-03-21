import mysql.connector
import sqlite3

# MySQL 配置 (从 convert_from_sqlite.py 获取)
mysql_config = {
    'user': 'root',
    'password': 'pass2004',
    'host': 'localhost',
    'database': 'ds_data_test1',
}

def check_mysql_structure():
    try:
        db = mysql.connector.connect(**mysql_config)
        cursor = db.cursor()
        cursor.execute("DESCRIBE user")
        columns = cursor.fetchall()
        print("MySQL User Table Structure:")
        for col in columns:
            print(col)
        db.close()
    except Exception as e:
        print(f"Error checking MySQL: {e}")

def check_sqlite_data():
    sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\backups\initial_sqlite_seed.db'
    try:
        conn = sqlite3.connect(sqlite_file)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(user)")
        columns = cur.fetchall()
        print("\nSQLite User Table Structure:")
        for col in columns:
            print(col)
        
        cur.execute("SELECT id, name, height FROM user LIMIT 5")
        rows = cur.fetchall()
        print("\nSQLite Sample Data (id, name, height):")
        for row in rows:
            print(row)
        conn.close()
    except Exception as e:
        print(f"Error checking SQLite: {e}")

if __name__ == "__main__":
    check_mysql_structure()
    check_sqlite_data()
