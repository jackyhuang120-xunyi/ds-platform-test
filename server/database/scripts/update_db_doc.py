import mysql.connector
import os
from datetime import datetime

def update_db_documentation():
    # 配置信息
    db_config = {
        'user': 'root',
        'password': 'pass2004',
        'host': 'localhost',
        'database': 'ds_data_test1'
    }
    
    doc_path = r'c:\Jonny\ds_test\ds-platform\server\database\docs\database_schema.md'
    
    try:
        db = mysql.connector.connect(**db_config)
        cursor = db.cursor(dictionary=True)
        
        # 1. 初始化预热：获取所有元数据
        # 获取表
        cursor.execute("""
            SELECT TABLE_NAME, TABLE_COMMENT, TABLE_ROWS, DATA_LENGTH, TABLE_TYPE
            FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s
        """, (db_config['database'],))
        all_entities = cursor.fetchall()
        
        # 获取外键映射 (用于生成链接)
        cursor.execute("""
            SELECT COLUMN_NAME, TABLE_NAME, REFERENCED_TABLE_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = %s AND REFERENCED_TABLE_NAME IS NOT NULL
        """, (db_config['database'],))
        fks_map = {(fk['TABLE_NAME'], fk['COLUMN_NAME']): fk['REFERENCED_TABLE_NAME'] for fk in cursor.fetchall()}

        # 2. 编写文档头部 & 看板
        markdown_content = "# 数据库专业结构手册\n\n"
        markdown_content += f"> **环境**: MySQL @ {db_config['host']} | **数据库**: `{db_config['database']}`\n"
        markdown_content += f"> **更新时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # 统计看板
        total_tables = len([e for e in all_entities if e['TABLE_TYPE'] == 'BASE TABLE'])
        total_views = len([e for e in all_entities if e['TABLE_TYPE'] == 'VIEW'])
        total_rows = sum(e['TABLE_ROWS'] or 0 for e in all_entities)
        
        markdown_content += "## 📊 数据库概览看板\n\n"
        markdown_content += "| 统计项 | 数值 | 统计项 | 数值 |\n"
        markdown_content += "| --- | --- | --- | --- |\n"
        markdown_content += f"| 物理数据表 | **{total_tables}** | 数据库视图 | **{total_views}** |\n"
        markdown_content += f"| 预估总行数 | **{total_rows:,}** | 采集采样深度 | **10 Lines** |\n\n"

        # 3. 业务模块分组逻辑
        groups = {
            "👤 用户与权限": ["user", "gender", "group"],
            "📊 核心业务记录": ["test_record", "train_record", "rom"],
            "📖 系统字典配置": ["test_type", "train_type", "body_part"],
            "🔍 数据汇总视图": ["_view$"] # 以view结尾的通常是视图，但下面会按类型分
        }
        
        processed_tables = []
        
        markdown_content += "## 📂 业务模块目录\n\n"
        for group_name, keywords in groups.items():
            if group_name == "🔍 数据汇总视图": continue # 视图单独放
            markdown_content += f"- **{group_name}**\n"
            for entity in all_entities:
                if entity['TABLE_TYPE'] == 'BASE TABLE':
                    t_name = entity['TABLE_NAME']
                    if any(k in t_name for k in keywords) and t_name not in processed_tables:
                        markdown_content += f"  - [{t_name}](#表-{t_name.replace('_', '')})\n"
                        processed_tables.append(t_name)
        
        # 处理未分类的表
        remaining = [e['TABLE_NAME'] for e in all_entities if e['TABLE_TYPE'] == 'BASE TABLE' and e['TABLE_NAME'] not in processed_tables]
        if remaining:
            markdown_content += "- **📦 其它数据表**\n"
            for r in remaining:
                markdown_content += f"  - [{r}](#表-{r.replace('_', '')})\n"

        markdown_content += "- **👁️ 数据库视图**\n"
        for e in all_entities:
            if e['TABLE_TYPE'] == 'VIEW':
                markdown_content += f"  - [{e['TABLE_NAME']}](#视图-{e['TABLE_NAME'].replace('_', '')})\n"

        markdown_content += "\n---\n\n"

        # 4. 逻辑关系图
        markdown_content += "## 🔗 逻辑关系图 (ER图)\n\n"
        markdown_content += "```mermaid\nerDiagram\n"
        for (table, col), ref_table in fks_map.items():
            markdown_content += f"    {ref_table} ||--o{{ {table} : \"{col}\"\n"
        markdown_content += "```\n\n---\n\n"

        # 5. 实体详情 (表)
        markdown_content += "## 📑 物理数据表详情\n\n"
        for table in all_entities:
            if table['TABLE_TYPE'] != 'BASE TABLE': continue
            
            t_name = table['TABLE_NAME']
            markdown_content += f"### 表: `{t_name}`\n"
            markdown_content += f"> {table['TABLE_COMMENT'] or '暂无描述'}\n\n"
            markdown_content += f"- 规模: `{table['TABLE_ROWS']}` 行 | 占用: `{round(table['DATA_LENGTH']/1024,1)} KB`\n\n"
            
            # 字段
            cursor.execute(f"SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s ORDER BY ORDINAL_POSITION", (db_config['database'], t_name))
            cols = cursor.fetchall()
            markdown_content += "| 字段名 | 类型 | 约束 | 备注 |\n"
            markdown_content += "| --- | --- | --- | --- |\n"
            for c in cols:
                # 智能备注：添加外键链接
                note = c['COLUMN_COMMENT'] or ""
                if (t_name, c['COLUMN_NAME']) in fks_map:
                    target = fks_map[(t_name, c['COLUMN_NAME'])]
                    note = f"关联自: [`{target}`](#表-{target.replace('_', '')}) " + note
                
                cstr = "PK " if c['COLUMN_KEY'] == 'PRI' else ""
                if c['IS_NULLABLE'] == 'NO': cstr += "NN "
                
                markdown_content += f"| `{c['COLUMN_NAME']}` | {c['COLUMN_TYPE']} | {cstr} | {note} |\n"
            
            markdown_content += f"\n#### 数据预览 (Top 10)\n{get_data_sample_table(db, t_name)}\n---\n\n"

        # 6. 视图详情
        markdown_content += "## 👁️ 数据库视图详情\n\n"
        for entity in all_entities:
            if entity['TABLE_TYPE'] != 'VIEW': continue
            v_name = entity['TABLE_NAME']
            markdown_content += f"### 视图: `{v_name}`\n"
            markdown_content += f"#### 数据预览 (Top 10)\n{get_data_sample_table(db, v_name)}\n"
            
            cursor.execute(f"SHOW CREATE VIEW `{v_name}`")
            v_sql_raw = cursor.fetchone()
            v_sql = v_sql_raw.get('Create View') or list(v_sql_raw.values())[1]
            markdown_content += f"<details><summary>查看 SQL 源码</summary>\n\n```sql\n{v_sql}\n```\n\n</details>\n\n---\n\n"

        # 7. 保存
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        print(f"成功导出专业级文档: {doc_path}")
        db.close()
        
    except Exception as e:
        import traceback
        print(f"导出失败: {e}")
        traceback.print_exc()

def get_data_sample_table(db, name, limit=10):
    try:
        sample_cursor = db.cursor()
        sample_cursor.execute(f"SELECT * FROM `{name}` LIMIT {limit}")
        sample_data = sample_cursor.fetchall()
        col_names = [desc[0] for desc in sample_cursor.description]
        if not sample_data: return "_无有效采样数据_"
        
        md = "| " + " | ".join(col_names) + " |\n| " + " | ".join(["---"] * len(col_names)) + " |\n"
        for row in sample_data:
            md += "| " + " | ".join([str(x).replace('\n', ' ') if x is not None else "*NULL*" for x in row]) + " |\n"
        return md
    except: return "> ⚠️ 采样失败"

if __name__ == "__main__":
    update_db_documentation()
