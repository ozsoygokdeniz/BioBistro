from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import date

# --- PDF Parsing Schemas (Immutable / Functional Programming) ---

class BloodTestParameter(BaseModel):
    # Functional Programming prensiplerine uymak için model_config = ConfigDict(frozen=True) kullanıldı
    # Değerleri yaratıldıktan sonra değiştirilemez kılar.
    model_config = ConfigDict(frozen=True)

    parameter_name: str = Field(..., description="Biyobelirteç adı, örn. 'Ferritin'")
    value: str = Field(..., description="Elde edilen değer ('< 0.5' gibi durumları işlemek için string)")
    numeric_value: Optional[float] = Field(None, description="Eğer tamamen temiz bir sayıysa ayrıştırılmış sayısal değer")
    unit: str = Field(..., description="Ölçüm birimi, örn. 'mg/dL'")
    reference_range: Optional[str] = Field(None, description="PDF'te göründüğü şekliyle referans aralığı, örn. '10 - 120'")

class BloodTestExtraction(BaseModel):
    model_config = ConfigDict(frozen=True)

    date_taken: date = Field(..., description="Kan testinin yapıldığı tarih")
    parameters: List[BloodTestParameter] = Field(..., description="PDF tablolarından çıkarılan parametrelerin listesi")

# --- AI Insight Schemas ---

class Ingredient(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str = Field(..., description="Malzemenin adı (örn: Egg, Chicken meat)")
    amount: str = Field(..., description="Malzemenin ölçüsü veya miktarı (örn: 2x pcs, 1/4 kg)")

class MealRecommendation(BaseModel):
    model_config = ConfigDict(frozen=True)
    meal_type: str = Field(..., description="Öğün türü (Sabah, Öğle, Akşam)")
    food_name: str = Field(..., description="Önerilen yemeğin adı")
    reason: str = Field(..., description="Bu yemeğin neden önerildiğine dair tek cümlelik tahlil bağlantılı açıklama")
    prep_time: str = Field(..., description="Hazırlama süresi (örn: 20m)")
    difficulty: str = Field(..., description="Zorluk derecesi (Easy, Medium, Hard)")
    rating: str = Field(..., description="Yemek puanı (örn: 5.0, 4.8)")
    ingredients: List[Ingredient] = Field(..., description="Tarif için gerekli malzemeler listesi")
    image_url: str = Field(..., description="Yemeğin görseli için URL")

class DailyPlan(BaseModel):
    model_config = ConfigDict(frozen=True)
    day_name: str = Field(..., description="Gün adı (1. Gün, 2. Gün, 3. Gün)")
    meals: List[MealRecommendation] = Field(..., description="Günün 3 öğünü (Sabah, Öğle, Akşam)")

class NutritionalInsight(BaseModel):
    model_config = ConfigDict(frozen=True)

    summary: str = Field(..., description="Tıbbi analiz ve kan değerlerindeki genel tablonun özeti")
    potential_deficiencies: List[str] = Field(default=[], description="Eksik veya düşük olan vitamin/mineral isimleri")
    daily_plans: List[DailyPlan] = Field(default=[], description="3 farklı gün için detaylı öğün planı")
    foods_to_avoid: List[str] = Field(default=[], description="Kaçınılması veya azaltılması gereken yiyecek grupları")
    general_advice: List[str] = Field(default=[], description="Yaşam tarzı ve genel sağlık tavsiyeleri")

# --- Authentication & User Schemas ---

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    dietary_preferences: Optional[List[str]] = []

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    dietary_preferences: List[str]

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Blood Test Response Schemas ---

class BloodTestResultResponse(BaseModel):
    id: int
    parameter_name: str
    value: Optional[float]
    original_value: str
    unit: str
    reference_range: Optional[str]
    status: str = "unknown"  # "normal", "high", "low", "unknown"

    model_config = ConfigDict(from_attributes=True)

class BloodTestResponse(BaseModel):
    id: int
    date_taken: date
    results: List[BloodTestResultResponse] = []

    model_config = ConfigDict(from_attributes=True)

class BloodTestSummary(BaseModel):
    id: int
    date_taken: date
    result_count: int

    model_config = ConfigDict(from_attributes=True)

# --- User Update Schema ---

class UserUpdate(BaseModel):
    name: Optional[str] = None
    dietary_preferences: Optional[List[str]] = None
