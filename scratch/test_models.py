import google.generativeai as genai
import os
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')
load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

prompt = 'Return valid JSON: {"status": "ok"}'

for model_name in ['gemini-2.5-flash', 'models/gemini-2.5-flash', 'gemini-2.0-flash']:
    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                response_mime_type='application/json'
            )
        )
        resp = model.generate_content(prompt)
        print(f'BASARILI [{model_name}]:', resp.text[:80])
    except Exception as e:
        err = str(e)
        print(f'HATA [{model_name}]: {err[:150]}')
