import google.generativeai as genai
import os
import warnings
warnings.filterwarnings('ignore')
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

try:
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        generation_config=genai.types.GenerationConfig(
            temperature=0.4,
            response_mime_type='application/json'
        )
    )
    resp = model.generate_content('Return only valid JSON: {"status": "ok"}')
    print('BASARILI:', resp.text[:200])
except Exception as e:
    print('HATA:', type(e).__name__)
    print('DETAY:', str(e))
