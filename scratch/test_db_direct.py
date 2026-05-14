from database import SessionLocal
import crud

print("Connecting to db...")
db = SessionLocal()
print("Getting user...")
try:
    user = crud.get_user_by_email(db, "test@biobistro.com")
    print(f"User: {user}")
except Exception as e:
    import traceback
    traceback.print_exc()
