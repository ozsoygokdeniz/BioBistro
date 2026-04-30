import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from schemas import NutritionalInsight, BloodTestParameter, BloodTestExtraction
from datetime import date

load_dotenv()

def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in .env")
        return

    print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")
    genai.configure(api_key=api_key)
    
    print("Available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        print("Testing simple generation...")
        response = model.generate_content("Hello, provide a JSON with a 'test': 'success' field.")
        print(f"Response: {response.text}")
        
        # Test the actual prompt logic but with dummy data
        dummy_data = "Ferritin: 5 ng/mL (Referans: 10 - 120)"
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.4,
            response_mime_type="application/json",
        )
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", 
            generation_config=generation_config
        )
        
        system_prompt = f"""
        Analyze this blood test and return a JSON matching this schema:
        {{
          "summary": "string",
          "potential_deficiencies": ["string"],
          "daily_plans": [
             {{
               "day_name": "1. Gün",
               "meals": [
                 {{
                   "meal_type": "Sabah",
                   "food_name": "string",
                   "reason": "string",
                   "prep_time": "string",
                   "difficulty": "Easy",
                   "rating": "string",
                   "ingredients": [ {{"name": "string", "amount": "string"}} ],
                   "image_url": "string"
                 }}
               ]
             }}
          ],
          "foods_to_avoid": ["string"],
          "general_advice": ["string"]
        }}
        Data: {dummy_data}
        """
        
        print("Testing full prompt logic...")
        response = model.generate_content(system_prompt)
        print(f"AI Response text: {response.text}")
        
        result_dict = json.loads(response.text)
        insight = NutritionalInsight(**result_dict)
        print("SUCCESS: NutritionalInsight validated successfully!")
        
    except Exception as e:
        print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    test_gemini()
