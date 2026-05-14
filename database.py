import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# .env'den Supabase bağlantısını al
SQLALCHEMY_DATABASE_URL = os.getenv("ALEMBIC_DB_URL", os.getenv("SUPABASE_DB_URL"))

# NullPool yerine standart havuzlama ve pre-ping kullanıyoruz (Kopmaları önlemek için)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=10,
    max_overflow=20
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Veritabanı oturumunu almak için dependency (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
