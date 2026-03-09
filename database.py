import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# .env'den Supabase bağlantısını al, bulamazsa yedeğe düş
SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DB_URL", "postgresql://postgres:password@localhost:5432/biobistro")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Veritabanı oturumunu almak için dependency (FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
