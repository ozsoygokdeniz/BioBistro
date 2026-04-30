from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import crud
from schemas import UserCreate, UserResponse, Token
from core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Yeni bir kullanıcı kaydeder."""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten sisteme kayıtlı.")
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Kullanıcının email ve şifresini kontrol ederek JWT Access Token döner."""
    user = crud.get_user_by_email(db, email=form_data.username) # OAuth2 formunda fiald ismi username'dir ama biz email kullanıyoruz
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yanlış email veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Şifre geçerli, token üret
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
