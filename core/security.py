from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

# JWT Yapılandırması
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "b39c0b1f2d6e4921b71d9dsa02e3ab4fc3bd98sa0a2b8d9")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 gün geçerli

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verilen düz şifrenin, veritabanındaki hashlenmiş haliyle uyuşup uyuşmadığını denetler."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Düz şifreyi geri döndürülemez şekilde bcrypt ile şifreler."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Kullanıcı bilgileri (örn: subs='1') içeren süreli bir JWT Token üretir."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
