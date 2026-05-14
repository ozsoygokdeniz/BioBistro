import requests
import json
import os

BASE = "http://localhost:8000/api/v1"

print("=== Login ===")
resp = requests.post(f"{BASE}/auth/login", data={"username": "gokdenizozs@gmail.com", "password": "test123"})
if resp.status_code != 200:
    resp = requests.post(f"{BASE}/auth/login", data={"username": "test@biobistro.com", "password": "test123"})

if resp.status_code != 200:
    print("Login failed")
    print(resp.text)
    exit()

token = resp.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
print(f"Token: {token[:30]}...")

pdf_path = r"C:\Users\Gaming\BioBistro\Enabiz-Tahlilleri 2.pdf"
if not os.path.exists(pdf_path):
    print("No pdf found")
    exit()

print("\n=== Uploading PDF ===")
with open(pdf_path, "rb") as f:
    files = {"file": ("test.pdf", f, "application/pdf")}
    resp_upload = requests.post(f"{BASE}/blood-tests/upload", headers=headers, files=files)

print(f"Upload Status: {resp_upload.status_code}")
print(resp_upload.text)
