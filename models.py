from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Table, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

# Kullanıcılar ve Alerjiler için Çoka-Çok bağlantı tablosu
user_allergies = Table(
    'user_allergies',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('allergy_id', Integer, ForeignKey('allergies.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    dietary_preferences = Column(JSON, default=list) # örn. ["Vegan", "Keto"]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    allergies = relationship('Allergy', secondary=user_allergies, back_populates='users')
    blood_tests = relationship('BloodTest', back_populates='user', cascade="all, delete-orphan")

class Allergy(Base):
    __tablename__ = 'allergies'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # örn. "Yer Fıstığı", "Gluten"
    
    users = relationship('User', secondary=user_allergies, back_populates='allergies')

class BloodTest(Base):
    __tablename__ = 'blood_tests'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    date_taken = Column(DateTime, nullable=False)
    pdf_url = Column(String, nullable=True) # İsteğe bağlı, kaydedilen PDF'in linki
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='blood_tests')
    results = relationship('BloodTestResult', back_populates='blood_test', cascade="all, delete-orphan")

class BloodTestResult(Base):
    __tablename__ = 'blood_test_results'
    id = Column(Integer, primary_key=True, index=True)
    blood_test_id = Column(Integer, ForeignKey('blood_tests.id'), nullable=False)
    parameter_name = Column(String, nullable=False) # örn. "Ferritin"
    value = Column(Float, nullable=True) # Normalize edilmiş değer
    original_value = Column(String, nullable=False) # PDF'ten çıkarılan orijinal metin
    unit = Column(String, nullable=False) # Normalize edilmiş birim
    reference_range = Column(String, nullable=True) # örn. "10 - 120"
    
    blood_test = relationship('BloodTest', back_populates='results')
