"""PostgreSQL (Supabase) users tablosuna profil kolonlarını ekler."""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Mevcut kolonları çek
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
    ))
    cols = [row[0] for row in result]
    print("Mevcut kolonlar:", cols)

    migrations = [
        ("age",       "INTEGER"),
        ("weight_kg", "FLOAT"),
        ("height_cm", "FLOAT"),
        ("goal",      "TEXT"),
    ]

    for col, typ in migrations:
        if col not in cols:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typ}"))
            print(f"  ✅ Eklendi: {col} ({typ})")
        else:
            print(f"  ℹ️  Zaten var: {col}")

    conn.commit()
    print("\nMigration tamamlandı.")
