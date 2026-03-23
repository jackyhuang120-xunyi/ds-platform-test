import pymysql
from datetime import datetime, timedelta
import random

def simulate_upload():
    # 数据库连接配置 (参考自 server/src/config/db.js)
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'ds_data_test1',
    }

    print("正在连接数据库 ds_data_test1...")
    try:
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()

        # 模拟生成一条测试记录
        # 这里我们模拟一个“等速测试”记录 (type=1)
        now = datetime.now()
        begin_time = now - timedelta(minutes=5)
        end_time = now

        # 定义需要写入的数据字段
        record_data = {
            'uid': 1,                    # 用户ID (对应 user 表，1 为李雷)
            'type': 1,                   # 测试类型 (对应 test_type 表，1: 等速测试)
            'part': 1,                   # 训练部位 (对应 body_part 表，1: 双腿)
            'cfg_roma': 110,             # 设定角度 A (mm)
            'cfg_romb': 330,             # 设定角度 B (mm)
            'cfg_con_speed': 100,        # 向心速度
            'cfg_group': 3,              # 组数
            'cfg_rest_time': 30,         # 组间歇 (秒)
            
            # 测试结果数据 (模拟随机生成)
            'con_stre_max': round(random.uniform(40.0, 60.0), 2),
            'con_stre_avg': round(random.uniform(30.0, 45.0), 2),
            'con_speed_max': round(random.uniform(90.0, 110.0), 2),
            'con_power_max': round(random.uniform(150.0, 200.0), 2),
            'result': 0,                 # 结果状态码 (0: 正常)
            
            'begin_time': begin_time.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': end_time.strftime('%Y-%m-%d %H:%M:%S'),
            'log': f'./log/{now.strftime("%Y-%m-%d")}/{now.strftime("%H-%M-%S")}_simulated.csv'
        }

        # 动态构建 SQL 插入语句
        columns = ', '.join(record_data.keys())
        placeholders = ', '.join(['%s'] * len(record_data))
        sql = f"INSERT INTO test_record ({columns}) VALUES ({placeholders})"
        
        # 执行插入
        print(f"准备插入数据: {record_data}")
        cursor.execute(sql, list(record_data.values()))
        connection.commit()

        print(f"✅ 上传模拟成功！新插入记录的 ID 为: {cursor.lastrowid}")
        print(f"关联日志路径为: {record_data['log']}")

    except pymysql.Error as e:
        print(f"❌ 数据库错误: {e}")
    except Exception as e:
        print(f"❌ 发生未知错误: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            cursor.close()
            connection.close()
            print("数据库连接已关闭。")

if __name__ == "__main__":
    # 提示用户需要安装 pymysql
    print("注意: 运行此脚本前确保已安装 pymysql。如果没有，请运行: pip install pymysql")
    simulate_upload()
