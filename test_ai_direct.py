import sys, traceback, os, re
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

print("=== 1. Gemini API Baglanti Testi ===")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("HATA: GEMINI_API_KEY bulunamadi. Lutfen .env dosyaniza ekleyin.")
    sys.exit(1)
print("GEMINI_API_KEY bulundu. Uzunluk:", len(api_key))

print("\n=== 2. AI Insight Testi (Gemini) ===")
try:
    from database import SessionLocal
    from models import BloodTest
    from services.ai_insight import generate_insight_from_db_results
    db = SessionLocal()
    test = db.query(BloodTest).order_by(BloodTest.id.desc()).first()
    insight = generate_insight_from_db_results(test.date_taken, test.results)
    db.close()
    print("BASARILI!")
    print("Summary:", insight.summary[:200])
    print("Plan sayisi:", len(insight.daily_plans))
except Exception as e:
    print("HATA:")
    print(traceback.format_exc())
