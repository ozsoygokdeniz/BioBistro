import requests
import os

BASE = "http://localhost:8000/api/v1"

# Register
resp_reg = requests.post(f"{BASE}/auth/register", json={
    "email": "testupload@biobistro.com",
    "password": "password123",
    "name": "Test User",
    "dietary_preferences": ["None"],
    "age": 25,
    "weight_kg": 70,
    "height_cm": 175,
    "goal": "Sağlıklı Yaşam"
})
print("Register:", resp_reg.status_code, resp_reg.text)

# Login
resp_login = requests.post(f"{BASE}/auth/login", data={"username": "testupload@biobistro.com", "password": "password123"})
if resp_login.status_code != 200:
    print("Login failed:", resp_login.text)
    exit()

token = resp_login.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

pdf_path = r"C:\Users\Gaming\BioBistro\Enabiz-Tahlilleri 2.pdf"
if not os.path.exists(pdf_path):
    print("No pdf found")
    exit()

print("\n=== Uploading PDF ===")
with open(pdf_path, "rb") as f:
    files = {"file": ("test.pdf", f, "application/pdf")}
    resp_upload = requests.post(f"{BASE}/blood-tests/upload", headers=headers, files=files)

print(f"Upload Status: {resp_upload.status_code}")
print(resp_upload.text[:500])
