from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud
from models import User
from services.auth_deps import get_current_user
from services.analytics import get_value_status
from services.ai_insight import generate_insight_from_db_results, refresh_single_meal
from schemas import BloodTestSummary, BloodTestResponse, BloodTestResultResponse, NutritionalInsight, MealRecommendation
from pydantic import BaseModel

class MealRefreshRequest(BaseModel):
    meal_type: str
    rejected_food_name: str

router = APIRouter(
    prefix="/api/v1/blood-tests",
    tags=["Blood Tests"]
)

@router.get("", response_model=List[BloodTestSummary])
def list_blood_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Giriş yapan kullanıcının tüm kan testlerini listeler."""
    tests = crud.get_blood_tests_by_user(db, user_id=current_user.id)
    return [
        BloodTestSummary(id=t.id, date_taken=t.date_taken, result_count=len(t.results))
        for t in tests
    ]

@router.get("/{test_id}", response_model=BloodTestResponse)
def get_blood_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belirli bir kan testinin tüm parametrelerini, akıllı durum etiketiyle (normal/high/low) döner."""
    test = crud.get_blood_test_by_id(db, test_id=test_id, user_id=current_user.id)
    if not test:
        raise HTTPException(status_code=404, detail="Kan testi bulunamadı.")
    
    results_with_status = [
        BloodTestResultResponse(
            id=r.id,
            parameter_name=r.parameter_name,
            value=r.value,
            original_value=r.original_value,
            unit=r.unit,
            reference_range=r.reference_range,
            status=get_value_status(
                r.value,
                r.reference_range,
                raw_value=r.original_value,
                parameter_name=r.parameter_name,
            )
        )
        for r in test.results
    ]
    
    return BloodTestResponse(id=test.id, date_taken=test.date_taken, results=results_with_status)

@router.post("/{test_id}/insights", response_model=NutritionalInsight)
def generate_insights_for_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Veritabanında kayıtlı bir kan testini ID ile çekip Gemini AI analizine gönderir.
    PDF tekrar yüklemeye gerek kalmadan geçmiş testleri analiz eder.
    """
    test = crud.get_blood_test_by_id(db, test_id=test_id, user_id=current_user.id)
    if not test:
        raise HTTPException(status_code=404, detail="Kan testi bulunamadı.")
    
    if not test.results:
        raise HTTPException(status_code=422, detail="Bu testin hiç parametresi yok.")
    
    try:
        insight = generate_insight_from_db_results(
            test_date=test.date_taken, 
            results=test.results,
            dietary_preferences=current_user.dietary_preferences
        )
        return insight
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analiz başarısız: {str(e)}")

@router.post("/{test_id}/insights/refresh", response_model=MealRecommendation)
def refresh_meal_for_test(
    test_id: int,
    body: MealRefreshRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belirli bir öğünü yenilemek için kullanılır."""
    test = crud.get_blood_test_by_id(db, test_id=test_id, user_id=current_user.id)
    if not test:
        raise HTTPException(status_code=404, detail="Kan testi bulunamadı.")
    
    try:
        new_meal = refresh_single_meal(
            test_date=test.date_taken,
            results=test.results,
            meal_type=body.meal_type,
            rejected_food=body.rejected_food_name,
            dietary_preferences=current_user.dietary_preferences
        )
        return new_meal
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Yenileme başarısız: {str(e)}")
