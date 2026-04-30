from database import SessionLocal
from models import User
import crud
from schemas import UserCreate

db = SessionLocal()
email = "test_persistence@biobistro.com"

# 1. Clean up if exists
user_exists = db.query(User).filter_by(email=email).first()
if user_exists:
    db.delete(user_exists)
    db.commit()
    print("Cleaned up existing user")

# 2. Create user
new_user_data = UserCreate(
    name="Persistence Test",
    email=email,
    password="password123",
    dietary_preferences=[]
)
created_user = crud.create_user(db, new_user_data)
print(f"User created: {created_user.email} (ID: {created_user.id})")

# 3. Retrieve from new session
db.close()
db2 = SessionLocal()
retrieved_user = db2.query(User).filter_by(email=email).first()

if retrieved_user:
    print(f"VERIFICATION SUCCESS: Found user {retrieved_user.email} in new session.")
else:
    print("VERIFICATION FAILURE: User not found in new session!")

db2.close()
