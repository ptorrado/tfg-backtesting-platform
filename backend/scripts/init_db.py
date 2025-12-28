# app/init_db.py
from app.db import Base, engine
from app import models  # importa todos tus modelos para que se registren en Base

def main():
    print("Creando todas las tablas en backtest_lab...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas.")

if __name__ == "__main__":
    main()
