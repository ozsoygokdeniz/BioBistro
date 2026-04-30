import os
import json
import logging
from dotenv import load_dotenv
from services.ai_insight import generate_insight_from_db_results
from schemas import NutritionalInsight

# Logging'i console'a verelim ki görelim
logging.basicConfig(level=logging.INFO)
load_dotenv()

class MockResult:
    def __init__(self, name, val, unit, ref):
        self.parameter_name = name
        self.original_value = val
        self.unit = unit
        self.reference_range = ref

def test_actual_function():
    print("Testing generate_insight_from_db_results...")
    mock_results = [
        MockResult("Ferritin", "5", "ng/mL", "10 - 120"),
        MockResult("Hemoglobin", "11", "g/dL", "13.5 - 17.5")
    ]
    
    try:
        insight = generate_insight_from_db_results("2024-03-26", mock_results)
        print("\n--- FINAL INSIGHT ---")
        print(insight.model_dump_json(indent=2))
        print("\nSUCCESS!")
    except Exception as e:
        print(f"\nFAILED: {str(e)}")

if __name__ == "__main__":
    test_actual_function()
