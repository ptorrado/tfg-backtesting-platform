#!/bin/bash
set -e

# 1. Run the seeder immediately on startup
echo "Starting initial market data seed..."
python scripts/seed_market_data.py || echo "Warning: Initial seed failed, continuing..."

# 2. Start the daily scheduler (blocking)
echo "Starting daily scheduler..."
exec python scripts/scheduler.py
