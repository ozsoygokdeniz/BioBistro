from sqlalchemy.orm import Session
from models import User, BloodTest, BloodTestResult
from schemas import BloodTestExtraction, UserCreate
from core.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    """"E-posta adresi ile veritabanından kullanıcıyı çeker."""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    """"Gelen şifreyi geri döndürülemez hash'e çevirip yeni kullanıcıyı kaydeder."""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        dietary_preferences=user.dietary_preferences
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def save_blood_test_extraction(db: Session, user_id: int, extraction: BloodTestExtraction) -> BloodTest:
    """
    PDF'ten çıkarılan formattaki veriyi veritabanına kaydeder.
    """
    # 1. Kan testi başlığını oluştur
    db_blood_test = BloodTest(
        user_id=user_id,
        date_taken=extraction.date_taken,
        # pdf_url= "ileride aws s3 gibi bir yere yüklenirse buraya konur"
    )
    db.add(db_blood_test)
    db.commit()
    db.refresh(db_blood_test)

    # 2. PDF'ten okunan her bir parametreyi sonuç tablosuna eklemeye hazırlan
    db_results = []
    for param in extraction.parameters:
        db_result = BloodTestResult(
            blood_test_id=db_blood_test.id,
            parameter_name=param.parameter_name,
            value=param.numeric_value, # sayısal değer
            original_value=param.value, # PDF'teki orijinal metin ('< 0.5' vb)
            unit=param.unit,
            reference_range=param.reference_range
        )
        db_results.append(db_result)

    # Bulk insertion işlemler (Çoklu ekleme performansı için bulk_save_objects daha iyidir ama ORM add_all da iş görür)
    db.add_all(db_results)
    db.commit()

    return db_blood_test

def get_blood_tests_by_user(db: Session, user_id: int):
    """Kullanıcıya ait tüm kan testlerini tarih sırasıyla döner."""
    return (
        db.query(BloodTest)
        .filter(BloodTest.user_id == user_id)
        .order_by(BloodTest.date_taken.desc())
        .all()
    )

def get_blood_test_by_id(db: Session, test_id: int, user_id: int):
    """Belirli bir kan testini sahiplik kontrolüyle getirir."""
    return (
        db.query(BloodTest)
        .filter(BloodTest.id == test_id, BloodTest.user_id == user_id)
        .first()
    )

def update_user(db: Session, user: User, name: str = None, dietary_preferences: list = None):
    """Kullanıcının profilini (ad ve/veya diyet tercihleri) günceller."""
    if name is not None:
        user.name = name
    if dietary_preferences is not None:
        user.dietary_preferences = dietary_preferences
    db.commit()
    db.refresh(user)
    return user
