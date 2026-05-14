from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud
from models import User
from services.auth_deps import get_current_user
from services.analytics import get_value_status
from services.ai_insight import generate_insight_from_db_results, refresh_single_meal
from schemas import (
    BloodTestSummary, BloodTestResponse, BloodTestResultResponse,
    NutritionalInsight, MealRecommendation,
    BloodTestHistoryItem, ParameterTrend, ParameterTrendPoint
)
from pydantic import BaseModel

class MealRefreshRequest(BaseModel):
    meal_type: str
    rejected_food_name: str

router = APIRouter(
    prefix="/api/v1/blood-tests",
    tags=["Blood Tests"]
)

@router.get("/history", response_model=List[BloodTestHistoryItem])
def get_blood_test_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının tüm tahlillerini normal/high/low sayılarıyla listeler."""
    tests = crud.get_blood_tests_by_user(db, user_id=current_user.id)
    items = []
    for t in tests:
        counts = {"normal": 0, "high": 0, "low": 0}
        for r in t.results:
            stat = get_value_status(r.value, r.reference_range, raw_value=r.original_value, parameter_name=r.parameter_name)
            if stat in counts:
                counts[stat] += 1
        items.append(BloodTestHistoryItem(
            id=t.id,
            date_taken=t.date_taken,
            result_count=len(t.results),
            normal_count=counts["normal"],
            high_count=counts["high"],
            low_count=counts["low"],
        ))
    return items


@router.get("/trends", response_model=List[ParameterTrend])
def get_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tüm tahlillerdeki parametrelerin zaman serisi trend verisini döner."""
    grouped = crud.get_parameter_trends(db, user_id=current_user.id)
    trends = []
    for param_name, points in grouped.items():
        trend_points = []
        for p in points:
            status = get_value_status(
                p["value"], p.get("reference_range"),
                raw_value=p.get("original_value"),
                parameter_name=param_name
            )
            trend_points.append(ParameterTrendPoint(
                date=p["date"],
                value=p["value"],
                status=status,
            ))
        unit = points[0]["unit"] if points else ""
        trends.append(ParameterTrend(parameter_name=param_name, unit=unit, points=trend_points))
    # Önce çok noktalı parametreleri göster
    trends.sort(key=lambda t: len(t.points), reverse=True)
    return trends


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
