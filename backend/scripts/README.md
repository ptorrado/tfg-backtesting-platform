# Backend Scripts

This directory contains utility scripts for the backtesting platform.

## Scripts

### Performance & Benchmarking

- **`performance_metrics.py`**: Comprehensive performance benchmark suite
  - Measures execution time across different data ranges (1-40 years)
  - Tests concurrency and scalability (1-50 concurrent users)
  - Analyzes throughput, latency (mean, P95, P99), and bottlenecks
  - Usage: `python scripts/performance_metrics.py`

### Data Management

- **`seed_assets.py`**: Seeds the database with available financial assets
  - Populates asset metadata (symbols, names, types)
  - Usage: `python scripts/seed_assets.py`

- **`seed_market_data.py`**: Downloads and updates market OHLCV data
  - Incremental download (only fetches new data)
  - Supports stocks, crypto, and forex
  - Usage: `python scripts/seed_market_data.py`

- **`scheduler.py`**: Background scheduler for automated tasks
  - Runs daily at 2:00 AM to update market data
  - Runs in Docker seeder container

### Database

- **`init_db.py`**: Initializes database schema
  - Creates TimescaleDB hypertables
  - Sets up database structure
  - Usage: `python scripts/init_db.py`

## Notes

All scripts should be run from the `backend/` directory root.
