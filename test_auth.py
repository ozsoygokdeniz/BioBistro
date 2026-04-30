from fastapi.testclient import TestClient
from main import app
import traceback

client = TestClient(app)
try:
    response = client.post("/api/v1/auth/login", data={"username": "e2e@biobistro.com", "password": "123"})
    print("STATUS:", response.status_code)
    print("BODY:", response.json())
except Exception as e:
    print("ERROR CAUGHT:")
    print(traceback.format_exc())
