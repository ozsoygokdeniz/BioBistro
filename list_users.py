from models import User
from database import SessionLocal

db = SessionLocal()

users = db.query(User).all()
print(f'Toplam kullanici: {len(users)}')
print('-' * 50)
for u in users:
    print(f'ID: {u.id} | Email: {u.email} | Ad: {u.name}')
db.close()
