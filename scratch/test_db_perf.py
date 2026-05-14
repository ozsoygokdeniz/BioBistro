import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import User
from crud import get_blood_tests_by_user, get_parameter_trends

def main():
    db = SessionLocal()
    users = db.query(User).all()
    if not users:
        print("No users found")
        return
    
    user = users[0]
    print(f"Testing for user: {user.email} (ID: {user.id})")

    start = time.time()
    tests = get_blood_tests_by_user(db, user.id)
    t1 = time.time()
    print(f"get_blood_tests_by_user took {t1 - start:.4f}s, found {len(tests)} tests")

    start = time.time()
    trends = get_parameter_trends(db, user.id)
    t2 = time.time()
    print(f"get_parameter_trends took {t2 - start:.4f}s, found {len(trends)} parameters")

    total_results = sum(len(t.results) for t in tests)
    print(f"Total results: {total_results}")

    from services.analytics import get_value_status
    start = time.time()
    for t in tests:
        counts = {"normal": 0, "high": 0, "low": 0}
        for r in t.results:
            stat = get_value_status(r.value, r.reference_range, raw_value=r.original_value, parameter_name=r.parameter_name)
    t3 = time.time()
    print(f"get_value_status loop took {t3 - start:.4f}s")

if __name__ == "__main__":
    main()
