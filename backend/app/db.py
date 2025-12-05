# app/db.py
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Carga variables de entorno (.env)
load_dotenv()

# URL de conexión, viene de tu .env
DATABASE_URL = os.getenv("DATABASE_URL")

print(">>> DATABASE_URL en db.py:", repr(DATABASE_URL), "tipo:", type(DATABASE_URL))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definido en el .env")

# Por si en algún momento por accidente estuviera en bytes:
if isinstance(DATABASE_URL, bytes):
    DATABASE_URL = DATABASE_URL.decode("utf-8", errors="replace")

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
    from sqlalchemy.orm import Session

    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
