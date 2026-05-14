import os
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types as genai_types

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Test ediliyor: gemini-2.5-flash + yeni SDK")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Bana sadece JSON dondur. Ornek: Hasta icin 1 yemek oneri.",
    config=genai_types.GenerateContentConfig(
        system_instruction="Sen diyetisyensin. Sadece JSON dondur.",
        temperature=0.4,
        response_mime_type="application/json",
    )
)

print("BASARILI!")
print(response.text[:300])
