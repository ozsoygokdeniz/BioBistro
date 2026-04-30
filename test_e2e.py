"""
BioBistro Uçtan Uca (End-to-End) Test Scripti
=============================================
Bu script, tüm API rotalarını sırayla test eder.
Çalıştırmadan önce:
  1. .env dosyanızın hazır olduğundan emin olun
  2. Sunucunun çalıştığından emin olun: uvicorn main:app --reload
  3. Bu scripti çalıştırın: python test_e2e.py
"""
import requests
import json

BASE_URL = "http://localhost:8080"
PDF_PATH = "Enabiz-Tahlilleri 2.pdf"

def ok(label: str, resp: requests.Response, expected_status: int = 200):
    passed = resp.status_code == expected_status
    icon = "[OK]" if passed else "[FAIL]"
    print(f"{icon} [{resp.status_code}] {label}")
    if not passed:
        print(f"   -> {resp.text[:300]}")
    return passed

def run():
    token = None
    blood_test_id = None

    print("\n========== BioBistro E2E Test ==========\n")

    # 1. Kayıt ol
    r = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "name": "E2E Test Kullanıcısı",
        "email": "e2e@biobistro.com",
        "password": "test1234",
        "dietary_preferences": ["Omnivore"]
    })
    ok("POST /register", r, expected_status=200)

    # 2. Giriş yap ve token al
    r = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
        "username": "e2e@biobistro.com",
        "password": "test1234"
    })
    if ok("POST /login", r):
        token = r.json()["access_token"]
        print(f"   → Token alındı: {token[:30]}...")

    if not token:
        print("\n❌ Token alınamadı, test durduruluyor.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Profil görüntüle
    r = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    ok("GET /users/me", r)

    # 4. Profil güncelle
    r = requests.patch(f"{BASE_URL}/api/v1/users/me", headers=headers, json={
        "dietary_preferences": ["Vegan", "Gluten-Free"]
    })
    ok("PATCH /users/me", r)

    # 5. PDF parse (token gerektirmez)
    with open(PDF_PATH, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/v1/blood-tests/parse",
                          files={"file": (PDF_PATH, f, "application/pdf")})
    ok("POST /blood-tests/parse", r)

    # 6. PDF yükle ve DB'ye kaydet (token gerektirir)
    with open(PDF_PATH, "rb") as f:
        r = requests.post(f"{BASE_URL}/api/v1/blood-tests/upload",
                          headers=headers,
                          files={"file": (PDF_PATH, f, "application/pdf")})
    if ok("POST /blood-tests/upload", r):
        blood_test_id = r.json().get("blood_test_id")
        print(f"   → blood_test_id: {blood_test_id}")

    # 7. Geçmiş tahlilleri listele
    r = requests.get(f"{BASE_URL}/api/v1/blood-tests", headers=headers)
    ok("GET /blood-tests", r)

    # 8. Tahlil detayı (analitik etiketlerle)
    if blood_test_id:
        r = requests.get(f"{BASE_URL}/api/v1/blood-tests/{blood_test_id}", headers=headers)
        if ok(f"GET /blood-tests/{blood_test_id}", r):
            results = r.json().get("results", [])
            high_count = sum(1 for res in results if res["status"] == "high")
            low_count  = sum(1 for res in results if res["status"] == "low")
            normal_count = sum(1 for res in results if res["status"] == "normal")
            print(f"   → Toplam {len(results)} parametre | 🔴 Yüksek: {high_count} | 🔵 Düşük: {low_count} | 🟢 Normal: {normal_count}")

    print("\n========== Test Bitti ==========\n")

if __name__ == "__main__":
    run()
