from sqlalchemy import text
from app.db import engine

def check_db_connection() -> None:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
