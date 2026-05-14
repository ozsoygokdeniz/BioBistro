"""
Backend'in hangi kodu calistirdigini test eder.
Bir token alir ve dogrudan insights endpoint'ini cagirir.
"""
import requests
import json

BASE = "http://localhost:8000/api/v1"

# 1. Login
print("=== Login ===")
resp = requests.post(f"{BASE}/auth/login", data={"username": "test@biobistro.com", "password": "test123"})
print(f"Status: {resp.status_code}")
if resp.status_code != 200:
    # Farkli kullanici dene
    resp = requests.post(f"{BASE}/auth/login", data={"username": "gokdenizozs@gmail.com", "password": "test123"})
    print(f"Status2: {resp.status_code}")
    if resp.status_code != 200:
        print("Login basarisiz - manuel token testi")
        print(resp.text[:500])
        exit()

token = resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print(f"Token: {token[:30]}...")

# 2. Kan testlerini listele
print("\n=== Blood Tests ===")
resp2 = requests.get(f"{BASE}/blood-tests", headers=headers)
print(f"Status: {resp2.status_code}")
print(resp2.text[:300])

if resp2.status_code == 200:
    tests = resp2.json()
    if tests:
        test_id = tests[0]["id"]
        print(f"\n=== Insights test (test_id={test_id}) ===")
        resp3 = requests.post(f"{BASE}/blood-tests/{test_id}/insights", headers=headers)
        print(f"Status: {resp3.status_code}")
        if resp3.status_code == 200:
            data = resp3.json()
            print(f"OK! Summary: {data.get('summary', '')[:100]}")
        else:
            print(f"HATA: {resp3.text[:1000]}")
