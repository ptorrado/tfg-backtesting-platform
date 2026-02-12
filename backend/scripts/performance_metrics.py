
import sys
import os
import time
import psutil
import statistics
import traceback
from typing import List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from tabulate import tabulate

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.services.simulation_service import run_and_store_simulation, get_simulation_detail
from app.schemas.simulations import SimulationRequest
from app.models import Simulation, Asset, MarketOHLCV

# ==========================================
# CONFIGURATION
# ==========================================
# Benchmark Settings
ASSETS = ["AAPL"]  # Keep simple for extensive concurrency
ALGORITHMS = [
    {"id": "sma_crossover", "params": {"short_window": 10, "long_window": 30}}
]
DURATION_YEARS = 5 
INITIAL_CAPITAL = 10000.0

# Concurrency Levels to Test
CONCURRENT_USERS_LEVELS = [1, 10, 20, 50] 

def get_process_memory():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024  # MB

def check_data_availability(db, asset_symbol: str) -> Tuple[bool, date, date]:
    asset = db.query(Asset).filter(Asset.symbol == asset_symbol).first()
    if not asset:
        return False, None, None
    
    first = db.query(MarketOHLCV.ts).filter(MarketOHLCV.asset_id == asset.id).order_by(MarketOHLCV.ts.asc()).first()
    last = db.query(MarketOHLCV.ts).filter(MarketOHLCV.asset_id == asset.id).order_by(MarketOHLCV.ts.desc()).first()
    
    if not first or not last:
        return False, None, None
        
    return True, first[0].date(), last[0].date()

def run_single_simulation_test(db, asset, algo_id, params, start, end):
    payload = SimulationRequest(
        asset=asset,
        algorithm=algo_id,
        start_date=start,
        end_date=end,
        initial_capital=INITIAL_CAPITAL,
        params=params
    )
    
    start_time = time.time()
    result = run_and_store_simulation(db, payload)
    end_time = time.time()
    
    return {
        "execution_time": end_time - start_time,
        "sim_id": result.id
    }

def fetch_cached_simulation(db, sim_id):
    start_time = time.time()
    _ = get_simulation_detail(db, sim_id)
    end_time = time.time()
    return end_time - start_time

def run_concurrency_test(num_users, asset, algo_id, params, start, end):
    def task():
        # Each thread gets its own DB session
        db = SessionLocal()
        try:
            return run_single_simulation_test(db, asset, algo_id, params, start, end)
        except Exception as e:
            return {"error": str(e)}
        finally:
            db.close()

    start_batch = time.time()
    # Use ThreadPool to simulate concurrent I/O constrained web requests
    with ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [executor.submit(task) for _ in range(num_users)]
        results = [f.result() for f in futures]
    end_batch = time.time()
    
    total_time = end_batch - start_batch
    
    # Analyze results
    errors = [r for r in results if "error" in r]
    successes = [r for r in results if "execution_time" in r]
    
    avg_exec_time = statistics.mean([r["execution_time"] for r in successes]) if successes else 0
    throughput = len(successes) / total_time if total_time > 0 else 0
    
    return {
        "users": num_users,
        "total_time": total_time,
        "avg_time_per_sim": avg_exec_time,
        "throughput_req_per_sec": throughput,
        "errors": len(errors)
    }

def main():
    print("Starting CACHING & CONCURRENCY Benchmark...", flush=True)
    print("===========================================", flush=True)
    
    db = SessionLocal()
    
    # 1. Setup Data
    asset = ASSETS[0]
    ok, start_avail, end_avail = check_data_availability(db, asset)
    if not ok:
        print(f"Error: No data for {asset}")
        return

    # Define standard test window (e.g., last 5 years)
    sim_end = end_avail
    sim_start = sim_end - timedelta(days=365 * DURATION_YEARS)
    if sim_start < start_avail:
        sim_start = start_avail
        
    algo = ALGORITHMS[0]
    print(f"Base Configuration: {asset} | {DURATION_YEARS} Years | {algo['id']}")
    
    # ----------------------------------------------------------------
    # 2. Cache vs Non-Cached
    # ----------------------------------------------------------------
    print("\n[Test 1] Cached vs Non-Cached Performance")
    
    # Cold Run (Non-Cached)
    print("  Running New Simulation (Non-Cached)...", end=" ", flush=True)
    cold_res = run_single_simulation_test(db, asset, algo['id'], algo['params'], sim_start, sim_end)
    cold_time = cold_res["execution_time"]
    sim_id = cold_res["sim_id"]
    print(f"DONE ({cold_time:.4f} s)")
    
    # Warm Run (Cached Fetch)
    print("  Fetching Stored Result (Cached)...", end=" ", flush=True)
    warm_times = []
    for _ in range(10): # Run multiple times to get stable read
        warm_times.append(fetch_cached_simulation(db, sim_id))
    
    avg_warm_time = statistics.mean(warm_times)
    print(f"DONE (Avg: {avg_warm_time:.4f} s)")
    
    speedup = cold_time / avg_warm_time if avg_warm_time > 0 else 0
    print(f"  >> CACHE SPEEDUP: {speedup:.1f}x faster")
    
    
    # ----------------------------------------------------------------
    # 3. Concurrency / Load Testing
    # ----------------------------------------------------------------
    print("\n[Test 2] Concurrency & Scalability (New Simulations)")
    db.close() # Close main session before threading
    
    concurrency_results = []
    
    for users in CONCURRENT_USERS_LEVELS:
        print(f"  Simulating {users} concurrent users...", end=" ", flush=True)
        stats = run_concurrency_test(users, asset, algo['id'], algo['params'], sim_start, sim_end)
        concurrency_results.append(stats)
        print(f"DONE (Throughput: {stats['throughput_req_per_sec']:.2f} req/s)")
        
        # Cooldown
        time.sleep(1)

    # 4. Output Summary Table
    print("\n\n================================ CONCURRENCY REPORT ================================\n")
    headers = {
        "users": "Concurrent Users",
        "total_time": "Batch Time (s)",
        "avg_time_per_sim": "Avg Time/Sim (s)",
        "throughput_req_per_sec": "Throughput (req/s)",
        "errors": "Errors"
    }
    # Format table data
    table_data = []
    for r in concurrency_results:
        table_data.append({k: round(v, 4) if isinstance(v, float) else v for k, v in r.items()})
        
    print(tabulate(table_data, headers=headers, tablefmt="github"))
    print("\n")

if __name__ == "__main__":
    main()
