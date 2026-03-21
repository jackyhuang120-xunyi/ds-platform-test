import sqlite3
import mysql.connector

# 配置
mysql_config = {
    'user': 'root',
    'password': 'pass2004',
    'host': 'localhost',
    'database': 'ds_data_test1',
}
sqlite_file = r'c:\Jonny\ds_test\ds-platform\server\database\backups\initial_sqlite_seed.db'

def audit_data():
    """
    审计脚本：对比 SQLite 和 MySQL 之间的数据差异
    特别寻找由于字段类型过窄（如 TINYINT）导致的数据被截断现象。
    """
    try:
        conn_sqlite = sqlite3.connect(sqlite_file)
        cur_sqlite = conn_sqlite.cursor()

        db_mysql = mysql.connector.connect(**mysql_config)
        cur_mysql = db_mysql.cursor()

        # 1. 获取 MySQL 中所有的表
        cur_mysql.execute("SHOW TABLES")
        tables = [t[0] for t in cur_mysql.fetchall()]
        
        print(f"正在对 {len(tables)} 张表进行完整性对比...\n")
        
        has_issue = False

        for table in tables:
            # 检查该表在 SQLite 中是否存在
            cur_sqlite.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not cur_sqlite.fetchone():
                continue

            # 获取主键（假设是 id）
            # 获取两边共有的列
            cur_mysql.execute(f"DESCRIBE `{table}`")
            mysql_cols = [c[0] for c in cur_mysql.fetchall()]
            
            cur_sqlite.execute(f"PRAGMA table_info(`{table}`)")
            sqlite_cols = [c[1] for c in cur_sqlite.fetchall()]
            
            common_cols = list(set(mysql_cols) & set(sqlite_cols))
            if 'id' not in common_cols:
                continue

            # 2. 逐行对比 (为了效率，我们重点对比数值型字段)
            # 我们直接进行大批量读取对比
            safe_cols = [f"`{c}`" for c in common_cols]
            cur_sqlite.execute(f"SELECT `id`, {', '.join(safe_cols)} FROM `{table}`")
            sqlite_rows = {row[0]: row for row in cur_sqlite.fetchall()}
            
            cur_mysql.execute(f"SELECT `id`, {', '.join(safe_cols)} FROM `{table}`")
            mysql_rows = {row[0]: row for row in cur_mysql.fetchall()}

            for row_id, s_row in sqlite_rows.items():
                if row_id not in mysql_rows:
                    continue
                
                m_row = mysql_rows[row_id]
                
                # 对比每一个字段的值
                for i, col_name in enumerate(['id'] + common_cols):
                    s_val = s_row[i]
                    m_val = m_row[i]
                    
                    # 如果不相等 (排除 None vs None 的情况)
                    if s_val != m_val and s_val is not None and m_val is not None:
                        # 重点检查截断标志 (MySQL 值为 127)
                        if m_val == 127 and s_val > 127:
                            print(f"[警告] 疑似截断: 表 `{table}`, 字段 `{col_name}`, ID: {row_id}")
                            print(f"      原始值 (SQLite): {s_val} -> 当前值 (MySQL): {m_val} (TINYINT 限制)")
                            has_issue = True
                        elif m_val == 32767 and s_val > 32767:
                            print(f"[警告] 疑似截断: 表 `{table}`, 字段 `{col_name}`, ID: {row_id}")
                            print(f"      原始值 (SQLite): {s_val} -> 当前值 (MySQL): {m_val} (SMALLINT 限制)")
                            has_issue = True
                        # 忽略微小的浮点数差异
                        elif isinstance(s_val, (int, float)) and abs(float(s_val) - float(m_val)) > 0.01:
                            # 只有较大的差异才报警
                            print(f"[注意] 数值不一致: 表 `{table}`, 字段 `{col_name}`, ID: {row_id}")
                            print(f"      SQLite: {s_val} vs MySQL: {m_val}")
                            has_issue = True

        if not has_issue:
            print("🎉 恭喜！未发现明显的字段截断或数据不一致问题。")
        else:
            print("\n上述字段可能需要修改 MySQL 类型（如改为 INT 或 FLOAT）并重新同步数据。")

        db_mysql.close()
        conn_sqlite.close()

    except Exception as e:
        print(f"审计失败: {e}")

if __name__ == "__main__":
    audit_data()
