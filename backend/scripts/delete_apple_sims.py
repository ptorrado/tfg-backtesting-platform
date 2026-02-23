import sys
import os
from datetime import date
from sqlalchemy import func

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.models.simulation import Simulation
from app.models.asset import Asset

def main():
    db = SessionLocal()
    try:
        apple = db.query(Asset).filter(Asset.name.ilike('%apple%')).first()
        if not apple:
            apple = db.query(Asset).filter(Asset.symbol == 'AAPL').first()
            
        if not apple:
            print("Apple asset not found")
            return
            
        print(f"Apple asset ID: {apple.id} (Symbol: {apple.symbol})")
        
        target_date = date(2026, 2, 23)
        
        sims = db.query(Simulation).filter(
            Simulation.asset_id == apple.id,
            func.date(Simulation.created_at) == target_date
        ).all()
        
        print(f"Found {len(sims)} simulations created on {target_date}")
        
        for s in sims:
            db.delete(s)
            
        db.commit()
        print("Successfully deleted simulations.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
