from database import SessionLocal
from models import User
from core.security import verify_password

db = SessionLocal()
user = db.query(User).filter_by(email='e2e@biobistro.com').first()

if user:
    print(f"USER FOUND: {user.email}")
    print(f"HASH: {user.hashed_password}")
    is_valid = verify_password("test1234", user.hashed_password)
    print(f"VERIFY TEST (test1234): {is_valid}")
else:
    print("USER NOT FOUND")

db.close()
