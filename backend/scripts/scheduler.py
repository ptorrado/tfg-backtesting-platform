import time
import schedule
import subprocess
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - SCHEDULER - %(message)s'
)
logger = logging.getLogger(__name__)

def run_seeder():
    logger.info("Starting scheduled market data update...")
    try:
        # Assuming we are in /app and the script is at /app/scripts/seed_market_data.py
        # We run it as a module or script. Let's assume PYTHONPATH includes /app
        result = subprocess.run(
            ["python", "scripts/seed_market_data.py"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            logger.info("Market data update completed successfully.")
            logger.info(result.stdout)
        else:
            logger.error(f"Market data update failed with code {result.returncode}")
            logger.error(result.stderr)
            
    except Exception as e:
        logger.error(f"Error running seeder: {e}")

def main():
    logger.info("Scheduler started. Waiting for 02:00 AM...")
    
    # Schedule the job every day at 02:00
    schedule.every().day.at("02:00").do(run_seeder)
    
    # Run once on startup if needed? No, entrypoint handles startup run.
    # checking loop
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
