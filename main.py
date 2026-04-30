from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
import crud
from models import User
from services.pdf_parser import parse_enabiz_pdf
from services.ai_insight import generate_nutritional_insight
from services.auth_deps import get_current_user
from core.logging_middleware import LoggingMiddleware
from schemas import BloodTestExtraction, NutritionalInsight
from routers import auth, blood_tests, users

app = FastAPI(
    title="BioBistro API",
    description="Backend API for parsing blood tests and providing AI-driven nutritional insights.",
    version="1.0.0"
)

# CORS yapılandırması (Frontend erişimi için)
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173", # Vite Frontend (Alternative)
    "http://localhost:5175", # New Vite Frontend Port
    "http://127.0.0.1:5175",
    "http://10.192.127.65:5173",  # Mobil erişim (LAN)
    "http://192.168.56.1:5173",   # Mobil erişim (LAN alt)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

# Auth rotalarını kaydet
app.include_router(auth.router)
app.include_router(blood_tests.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "BioBistro API çalışıyor", "status": "aktif"}

@app.post("/api/v1/blood-tests/parse", response_model=BloodTestExtraction)
async def parse_blood_test_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları yüklenebilir.")
    
    try:
        content = await file.read()
        extraction_result = parse_enabiz_pdf(content)
        return extraction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF okuma sırasında bir hata oluştu: {str(e)}")

@app.post("/api/v1/blood-tests/upload")
async def upload_blood_test_pdf(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları yüklenebilir.")
    
    try:
        content = await file.read()
        extraction_result = parse_enabiz_pdf(content)
        
        # Veritabanina token'ın sahibine (current_user) kaydet
        saved_blood_test = crud.save_blood_test_extraction(
            db, user_id=current_user.id, extraction=extraction_result
        )
        
        return {
            "message": "Kan testi başarıyla analiz edildi ve veritabanına kaydedildi.",
            "blood_test_id": saved_blood_test.id,
            "date_taken": saved_blood_test.date_taken,
            "parameters_saved_count": len(extraction_result.parameters)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Hata oluştu: {str(e)}")

@app.post("/api/v1/blood-tests/analyze", response_model=NutritionalInsight)
async def analyze_blood_test_pdf(file: UploadFile = File(...)):
    """
    Kullanıcının yüklediği PDF kan tahlilini okur ve anında Gemini yapay zekâsına 
    göndererek kişiselleştirilmiş beslenme analizi (JSON) döner.
    Not: Bu rota hızlı analiz içindir, veritabanına kaydetmez.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları yüklenebilir.")
    
    try:
        # 1. PDF'i oku ve yapılandırılmış veriye dönüştür
        content = await file.read()
        extraction_result = parse_enabiz_pdf(content)
        
        # 2. Çıkarılan bu veriyi AI servisine yolla ve tavsiyeyi al
        insight = generate_nutritional_insight(extraction_result)
        
        return insight
        
    except ValueError as ve:
         raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analiz süreci başarısız oldu: {str(e)}")
