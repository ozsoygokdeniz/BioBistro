"""
Yemek Tarama (Food Scan) Router - Gemini Vision tabanlı
POST /api/v1/food-scan/analyze
  - Görüntüyü Gemini Vision'a gönderir
  - Tek prompt ile: yemek adı + kalori + kan değeri yorumu alır
"""
import base64
import os
import logging
import json
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from services.auth_deps import get_current_user
from services.analytics import get_value_status
from pydantic import BaseModel
from typing import Optional
import crud
import google.genai as genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/food-scan", tags=["Food Scan"])


class FoodScanRequest(BaseModel):
    image_base64: str


class FoodScanResponse(BaseModel):
    food_name: str
    food_name_tr: str
    confidence: float
    calories_per_100g: Optional[int]
    protein_per_100g: Optional[float]
    fat_per_100g: Optional[float]
    carbs_per_100g: Optional[float]
    assessment: str  # "good" | "caution" | "bad" | "unknown"
    assessment_reason: str


def _format_blood_summary(results: list) -> str:
    """Kan tahlili sonuçlarını AI için kısa bir özete dönüştürür."""
    high, low = [], []
    for r in results:
        status = get_value_status(r.value, r.reference_range, r.original_value, r.parameter_name)
        if status == "high":
            high.append(f"{r.parameter_name} (YÜKSEK: {r.original_value} {r.unit})")
        elif status == "low":
            low.append(f"{r.parameter_name} (DÜŞÜK: {r.original_value} {r.unit})")

    if not high and not low:
        return "Tüm kan değerleri normal aralıkta."

    parts = []
    if high:
        parts.append("Yüksek: " + ", ".join(high))
    if low:
        parts.append("Düşük: " + ", ".join(low))
    return " | ".join(parts)


def _clean_json(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


@router.post("/analyze", response_model=FoodScanResponse)
async def analyze_food(
    request: FoodScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY bulunamadı.")

    # Kullanıcının son kan tahlilini çek
    blood_summary = "Henüz kan tahlili yüklenmemiş."
    tests = crud.get_blood_tests_by_user(db, user_id=current_user.id)
    if tests:
        blood_summary = _format_blood_summary(tests[-1].results)

    # Base64 → bytes
    try:
        image_bytes = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Geçersiz base64 görüntü verisi.")

    system_prompt = """Sen bir diyetisyen yapay zekasısın. Sana bir yemek fotoğrafı ve kullanıcının kan tahlili özeti verilecek.

Şu adımları izle:
1. Fotoğraftaki yemeği tanımla.
2. Yemeğin tahmini besin değerlerini hesapla (100g başına).
3. Kullanıcının kan değerleriyle bu yemeğin uyumunu değerlendir.

SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{
  "food_name": "ingilizce_yemek_adi",
  "food_name_tr": "Türkçe Yemek Adı",
  "confidence": 0.92,
  "calories_per_100g": 250,
  "protein_per_100g": 12.5,
  "fat_per_100g": 8.0,
  "carbs_per_100g": 30.0,
  "assessment": "good",
  "assessment_reason": "Bu yemeğin kan değerlerinize etkisi hakkında Türkçe 1-2 cümle açıklama."
}

assessment değeri şunlardan biri olmalı: "good", "caution", "bad", "unknown"
- good: kan değerlerine uygun, destekleyici
- caution: dikkatli tüketilmeli
- bad: kan değerleriyle çelişiyor, önerilmez
- unknown: kan tahlili yok veya belirsiz"""

    user_prompt = f"""Kan Tahlili Özeti: {blood_summary}

Fotoğraftaki yemeği analiz et ve yukarıdaki JSON formatında yanıt ver."""

    try:
        client = genai.Client(api_key=api_key)

        image_part = genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        text_part = genai_types.Part.from_text(text=user_prompt)

        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash"]
        response_text = None

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[image_part, text_part],
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.3,
                        response_mime_type="application/json",
                    ),
                )
                if response.text:
                    response_text = response.text
                    break
            except Exception as e:
                logger.warning(f"Gemini [{model_name}] hatası: {str(e)[:150]}")
                continue

        if not response_text:
            raise HTTPException(status_code=503, detail="Yapay zeka servisi şu an yanıt vermiyor.")

        cleaned = _clean_json(response_text)
        data = json.loads(cleaned)

        return FoodScanResponse(
            food_name=data.get("food_name", "unknown"),
            food_name_tr=data.get("food_name_tr", "Bilinmiyor"),
            confidence=float(data.get("confidence", 0.85)),
            calories_per_100g=data.get("calories_per_100g"),
            protein_per_100g=data.get("protein_per_100g"),
            fat_per_100g=data.get("fat_per_100g"),
            carbs_per_100g=data.get("carbs_per_100g"),
            assessment=data.get("assessment", "unknown"),
            assessment_reason=data.get("assessment_reason", "Değerlendirme yapılamadı."),
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse hatası: {e} | Raw: {response_text[:300]}")
        raise HTTPException(status_code=422, detail="Yapay zeka geçerli bir yanıt döndürmedi.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini Vision hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analiz sırasında hata: {str(e)[:200]}")
