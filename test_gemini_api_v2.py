import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from schemas import NutritionalInsight, DailyPlan, MealRecommendation, Ingredient
from pydantic import ValidationError

load_dotenv()

def test_gemini_comprehensive():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in .env")
        return

    print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")
    genai.configure(api_key=api_key)
    
    models_to_try = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-pro'
    ]
    
    available_models = []
    try:
        print("Listing available models...")
        for m in genai.list_models():
            available_models.append(m.name)
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"Error listing models: {str(e)}")

    for model_name in models_to_try:
        print(f"\n--- Testing model: {model_name} ---")
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=0.4,
                response_mime_type="application/json",
            )
            model = genai.GenerativeModel(
                model_name=model_name, 
                generation_config=generation_config
            )
            
            prompt = "Return a JSON matching this exact structure: {\"summary\": \"Test summary\", \"potential_deficiencies\": [], \"daily_plans\": [], \"foods_to_avoid\": [], \"general_advice\": []}"
            
            response = model.generate_content(prompt)
            print(f"Raw Response: {response.text}")
            
            data = json.loads(response.text)
            insight = NutritionalInsight(**data)
            print(f"SUCCESS with {model_name}!")
            return # Exit if success
            
        except Exception as e:
            print(f"FAILED with {model_name}: {str(e)}")

    print("\nAll tested models failed.")

if __name__ == "__main__":
    test_gemini_comprehensive()
