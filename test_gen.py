import os
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types as genai_types

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello",
        config=genai_types.GenerateContentConfig(
            temperature=0.4,
            response_mime_type="application/json",
        )
    )
    print("Success:", response.text)
except Exception as e:
    print("Hata:", str(e))
