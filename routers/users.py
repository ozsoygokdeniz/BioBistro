from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import crud
from models import User
from services.auth_deps import get_current_user
from schemas import UserResponse, UserUpdate

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"]
)

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Giriş yapan kullanıcının profil bilgisini döner."""
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Giriş yapan kullanıcının profil bilgisini günceller."""
    updated = crud.update_user(
        db,
        user=current_user,
        name=body.name,
        dietary_preferences=body.dietary_preferences,
        age=body.age,
        weight_kg=body.weight_kg,
        height_cm=body.height_cm,
        goal=body.goal,
    )
    return updated
