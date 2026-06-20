from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import crud
from models import User
from services.auth_deps import get_current_user
from schemas import SavedRecipeCreate, SavedRecipeResponse

router = APIRouter(
    prefix="/api/v1/recipes",
    tags=["Recipes"]
)

@router.get("/", response_model=List[SavedRecipeResponse])
def get_saved_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kullanıcının kaydettiği tüm tarifleri ve planları getirir."""
    return crud.get_saved_recipes_by_user(db, user_id=current_user.id)

@router.post("/", response_model=SavedRecipeResponse)
def save_recipe(
    body: SavedRecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Yeni bir tarifi veya planı veritabanına kaydeder."""
    return crud.create_saved_recipe(
        db,
        user_id=current_user.id,
        client_id=body.client_id,
        recipe_type=body.recipe_type,
        recipe_data=body.recipe_data
    )

@router.delete("/{client_id}")
def delete_saved_recipe(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Belirtilen client_id'ye göre kaydedilmiş tarifi/planı siler."""
    success = crud.delete_saved_recipe(db, user_id=current_user.id, client_id=client_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kayıtlı tarif bulunamadı."
        )
    return {"message": "Kayıtlı tarif başarıyla silindi."}
