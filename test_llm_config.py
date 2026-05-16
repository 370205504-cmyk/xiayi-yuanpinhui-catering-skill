#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
from pprint import pprint

BASE_URL = "http://localhost:3000"

def http_get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'TestBot/1.0'})
    with urllib.request.urlopen(req, timeout=10) as f:
        return f.read().decode('utf-8')

def http_post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'User-Agent': 'TestBot/1.0'}
    )
    with urllib.request.urlopen(req, timeout=10) as f:
        return f.read().decode('utf-8')

def test_backend_apis():
    print("=" * 70)
    print("🔍 开始测试后端API")
    print("=" * 70)
    
    try:
        # 1. 测试状态API
        print("\n1️⃣  测试配置状态API...")
        resp = http_get(f"{BASE_URL}/api/v1/llm-config/status")
        data = json.loads(resp)
        print("   ✅ 状态API正常")
        print("   返回数据:")
        pprint(data)
        
        if data.get("success") and data.get("data", {}).get("enabled"):
            print("   ✅ DeepSeek已启用")
            deepseek = data["data"]["providers"]["deepseek"]
            if deepseek["configured"]:
                print(f"   ✅ DeepSeek已配置: {deepseek['model']} ({deepseek['apiType']})")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    try:
        # 2. 测试提供商列表API
        print("\n2️⃣  测试提供商列表API...")
        resp = http_get(f"{BASE_URL}/api/v1/llm-config/providers")
        data = json.loads(resp)
        print(f"   ✅ 返回提供商数量: {len(data.get('data', []))}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    try:
        # 3. 测试保存API
        print("\n3️⃣  测试配置保存API...")
        test_config = {
            "provider": "deepseek",
            "apiKey": "sk-test-1234567890abcdef",
            "baseUrl": "https://api.deepseek.com/v1",
            "model": "deepseek-chat",
            "apiType": "openai"
        }
        resp = http_post_json(f"{BASE_URL}/api/v1/llm-config/config", test_config)
        data = json.loads(resp)
        print(f"   ✅ 返回: {data.get('message')}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

def test_frontend_pages():
    print("\n" + "=" * 70)
    print("📄 开始测试前端页面")
    print("=" * 70)
    
    pages = [
        ("/admin", "管理后台"),
        ("/llm-config-test.html", "LLM配置测试页")
    ]
    
    for path, name in pages:
        try:
            print(f"\n🔗 测试 {name} ({path})...")
            content = http_get(f"{BASE_URL}{path}")
            print(f"   ✅ 页面可访问")
            print(f"   内容长度: {len(content)} 字节")
            print(f"   开头内容: {repr(content[:250])}...")
        except Exception as e:
            print(f"   ❌ 错误: {e}")

def main():
    print("\n" + "=" * 70)
    print("🚀 完整功能测试套件")
    print("=" * 70)
    
    test_backend_apis()
    test_frontend_pages()
    
    print("\n" + "=" * 70)
    print("✅ 测试完成")
    print("=" * 70)

if __name__ == "__main__":
    main()
