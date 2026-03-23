import requests
import json
from datetime import datetime, timedelta
import random

def test_upload_api():
    base_url = "http://39.103.69.142:80/api"
    
    # 1. 登录获取 Token (使用 server/.env 中的管理员配置)
    print("1. 正在尝试登录获取 Token...")
    login_data = {
        "username": "admin",
        "password": "123456" 
    }
    
    try:
        login_res = requests.post(f"{base_url}/auth/login", json=login_data)
        if login_res.status_code != 200 or not login_res.json().get('success'):
            print(f"❌ 登录失败，状态码: {login_res.status_code}")
            print(f"服务器响应: {login_res.text}")
            print("请检查后端运行状态和账密。")
            return
            
        token = login_res.json()['token']
        print("✅ 登录成功，已获取授权 Token (Bearer)。")
    except Exception as e:
        print(f"❌ 请求后端接口失败 ({base_url}/auth/login):", e)
        print("请确认后端 Node 服务已启动并可以从外网访问。")
        return

    # 2. 准备上传数据 (模拟一台康复设备产生的数据)
    now = datetime.now()
    begin_time = now - timedelta(minutes=5)
    
    record_data = {
        'uid': 426,
        'type': 1,
        'part': 1,
        'cfg_roma': 110,
        'cfg_romb': 330,
        'cfg_con_speed': 100,
        'cfg_group': 3,
        'cfg_rest_time': 30,
        'con_stre_max': round(random.uniform(40.0, 60.0), 2),
        'result': 0,
        'begin_time': begin_time.strftime('%Y-%m-%d %H:%M:%S'),
        'end_time': now.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # 读取根目录新放入的真实测试文件 test.csv
    try:
        csv_file = open('c:/Jonny/ds_test/ds-platform/test.csv', 'rb')
    except Exception as e:
        print("❌ 无法打开 test.csv 文件:", e)
        return
        
    files = {
        'log_file': ('test.csv', csv_file, 'text/csv')
    }
    
    # 表单里的普通文本数据
    data = {
        'record_data': json.dumps(record_data)
    }
    
    # 请求头中带上 Token
    headers = {
        "Authorization": f"Bearer {token}"
    }

    print("\n2. 正在通过 HTTP POST 上传数据和 CSV 文件...")
    upload_url = f"{base_url}/trains/upload"
    try:
        response = requests.post(upload_url, data=data, files=files, headers=headers)
        if response.status_code == 200:
            print("✅ 接口返回成功！")
            print("服务器响应:", response.json())
            print(f"\n✨ 可以去查看 log/ 目录，检查是否生成了包含 device_data.csv 内容的文件！")
        else:
            print("❌ 接口返回失败，状态码:", response.status_code)
            print("服务器响应:", response.text)
    except Exception as e:
        print("❌ 请求失败:", e)

if __name__ == "__main__":
    print("=== 开始测试 Node.js 后端 API 接口上传流程 ===")
    test_upload_api()
