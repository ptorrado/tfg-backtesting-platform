# app/db.py
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# Carga variables de entorno (.env)
load_dotenv()

# URL de conexión, viene de tu .env
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definido en el .env")

# Motor SQLAlchemy (modo síncrono)
engine = create_engine(
    DATABASE_URL,
    echo=False,   # pon True si quieres ver el SQL que se ejecuta
    future=True,
)

# Factoría de sesiones
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base para los modelos
Base = declarative_base()


# Dependencia típica de FastAPI para inyectar la sesión
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
