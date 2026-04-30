import requests
import json
import os

pdf_path = r"C:\Users\Gaming\BioBistro\Enabiz-Tahlilleri 2.pdf"

if not os.path.exists(pdf_path):
    print("File not found:", pdf_path)
    exit(1)

url = "http://localhost:8000/api/v1/blood-tests/parse"

with open(pdf_path, "rb") as f:
    files = {"file": getattr(f, "name", "Enabiz-Tahlilleri 2.pdf")}
    files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
    print(f"Uploading {pdf_path} to {url}...")
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Response Data:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print("Error Response:")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("FastAPI server is not running on http://localhost:8000")
