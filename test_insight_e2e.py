"""
Backend'deki generate_insight_from_db_results fonksiyonunu
dogrudan calistirarak tam hatayi gormek icin test.
"""
import sys
import os
sys.path.insert(0, r'c:\Users\Gaming\BioBistro')
os.chdir(r'c:\Users\Gaming\BioBistro')

from dotenv import load_dotenv
load_dotenv()

print("=== ADIM 1: Import test ===")
try:
    from services.ai_insight import _get_gemini_response
    print("  OK: ai_insight import basarili")
except Exception as e:
    print(f"  HATA: {e}")
    sys.exit(1)

print("\n=== ADIM 2: Gemini API cagri testi ===")
try:
    sys_prompt = "Sen diyetisyensin. Sadece JSON dondur."
    user_prompt = 'Test Tarihi: 2026-01-01\nSadece {"test": "ok"} dondur.'
    result = _get_gemini_response(sys_prompt, user_prompt)
    print(f"  OK: {result[:100]}")
except Exception as e:
    print(f"  HATA tipi: {type(e).__name__}")
    print(f"  HATA mesaji: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n=== ADIM 3: Tam insight testi (mock veri) ===")
try:
    from services.ai_insight import generate_insight_from_db_results
    
    class MockResult:
        def __init__(self):
            self.parameter_name = "Hemoglobin"
            self.value = 12.0
            self.original_value = "12.0"
            self.unit = "g/dL"
            self.reference_range = "12-16"
    
    result = generate_insight_from_db_results(
        test_date="2026-01-01",
        results=[MockResult()],
        dietary_preferences=["none"]
    )
    print(f"  OK: summary = {result.summary[:80]}")
except Exception as e:
    print(f"  HATA tipi: {type(e).__name__}")
    print(f"  HATA mesaji: {str(e)}")
    import traceback
    traceback.print_exc()
