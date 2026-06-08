import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    print(f"API Key Starts With: {api_key[:10]}")
    client = genai.Client(api_key=api_key)
    
    # Yeni SDK ile modelleri listele
    print("Mevcut Modeller:")
    for m in client.models.list():
        if "gemini" in m.name.lower():
            print(f"- {m.name}")
except Exception as e:
    print(f"HATA: {e}")
