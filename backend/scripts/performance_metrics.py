
import sys
import os
import time
import psutil
import statistics
import traceback
from typing import List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from tabulate import tabulate

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Force UTF-8 encoding for console output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

from app.db.session import SessionLocal
from app.services.simulation_service import run_and_store_simulation, get_simulation_detail
from app.schemas.simulations import SimulationRequest
from app.models import Simulation, Asset, MarketOHLCV

# ==========================================
# CONFIGURATION
# ==========================================
ASSETS = ["AAPL"]
ALGORITHMS = [
    {"id": "sma_crossover", "params": {"short_window": 10, "long_window": 30}}
]
DURATION_YEARS = 5
INITIAL_CAPITAL = 10000.0

# Concurrency Levels to Test
CONCURRENT_USERS_LEVELS = [1, 10, 20, 50]

def get_process_cpu_percent():
    """Get current CPU usage of this process"""
    process = psutil.Process(os.getpid())
    return process.cpu_percent(interval=0.1)

def get_process_memory():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024

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
    """
    Run a single simulation and track its individual execution time.
    Returns dict with start_time, end_time, execution_time, and sim_id.
    """
    payload = SimulationRequest(
        asset=asset,
        algorithm=algo_id,
        start_date=start,
        end_date=end,
        initial_capital=INITIAL_CAPITAL,
        params=params
    )
    
    req_start = time.time()
    result = run_and_store_simulation(db, payload)
    req_end = time.time()
    
    return {
        "start_time": req_start,
        "end_time": req_end,
        "execution_time": req_end - req_start,
        "sim_id": result.id
    }

def run_concurrency_test(num_users, asset, algo_id, params, start, end):
    """
    Simulate N concurrent users each launching a simulation.
    
    Metrics tracked:
    - Wall-clock time: Time from start to last completion (batch time)
    - Individual latencies: How long each request took from start to finish
    - Throughput: Requests completed per second
    """
    def task():
        # Each thread gets its own DB session
        db = SessionLocal()
        try:
            return run_single_simulation_test(db, asset, algo_id, params, start, end)
        except Exception as e:
            return {"error": str(e), "traceback": traceback.format_exc()}
        finally:
            db.close()

    # Record batch start time
    batch_start = time.time()
    
    # Monitor CPU before starting
    cpu_before = get_process_cpu_percent()
    mem_before = get_process_memory()
    
    # Launch all requests concurrently using ThreadPool
    with ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [executor.submit(task) for _ in range(num_users)]
        results = [f.result() for f in as_completed(futures)]
    
    # Record batch end time
    batch_end = time.time()
    batch_wall_time = batch_end - batch_start
    
    # Monitor CPU after
    cpu_after = get_process_cpu_percent()
    mem_after = get_process_memory()
    
    # Analyze results
    errors = [r for r in results if "error" in r]
    successes = [r for r in results if "execution_time" in r]
    
    if not successes:
        return {
            "users": num_users,
            "errors": len(errors),
            "success": False
        }
    
    # Extract individual latencies
    latencies = [r["execution_time"] for r in successes]
    latencies.sort()
    
    # Calculate statistics
    latency_mean = statistics.mean(latencies)
    latency_min = min(latencies)
    latency_max = max(latencies)
    latency_median = statistics.median(latencies)
    
    # Calculate percentiles
    n = len(latencies)
    p95_idx = int(n * 0.95)
    p99_idx = int(n * 0.99)
    latency_p95 = latencies[min(p95_idx, n-1)]
    latency_p99 = latencies[min(p99_idx, n-1)]
    
    # Throughput = total completed / wall-clock time
    throughput = len(successes) / batch_wall_time if batch_wall_time > 0 else 0
    
    return {
        "users": num_users,
        "batch_wall_time": batch_wall_time,
        "latency_mean": latency_mean,
        "latency_min": latency_min,
        "latency_max": latency_max,
        "latency_median": latency_median,
        "latency_p95": latency_p95,
        "latency_p99": latency_p99,
        "throughput": throughput,
        "total_completed": len(successes),
        "errors": len(errors),
        "cpu_before": cpu_before,
        "cpu_after": cpu_after,
        "mem_delta_mb": mem_after - mem_before,
        "success": True
    }

def main():
    print("=" * 80)
    print("CONCURRENCY & LOAD TESTING BENCHMARK")
    print("=" * 80)
    print()
    
    db = SessionLocal()
    
    # Setup test parameters
    asset = ASSETS[0]
    ok, start_avail, end_avail = check_data_availability(db, asset)
    if not ok:
        print(f"Error: No data available for {asset}")
        return
    
    # Define test window (last 5 years)
    sim_end = end_avail
    sim_start = sim_end - timedelta(days=365 * DURATION_YEARS)
    if sim_start < start_avail:
        sim_start = start_avail
    
    algo = ALGORITHMS[0]
    
    print(f"Test Configuration:")
    print(f"  Asset: {asset}")
    print(f"  Algorithm: {algo['id']}")
    print(f"  Time Range: {sim_start} to {sim_end} ({DURATION_YEARS} years)")
    print(f"  Initial Capital: ${INITIAL_CAPITAL:,.0f}")
    print()
    print(f"Hardware Info:")
    print(f"  CPU Cores: {psutil.cpu_count(logical=False)} physical, {psutil.cpu_count(logical=True)} logical")
    print(f"  Total RAM: {psutil.virtual_memory().total / 1024**3:.1f} GB")
    print()
    print("=" * 80)
    print()
    
    db.close()
    
    # ----------------------------------------------------------------
    # Concurrency / Load Testing
    # ----------------------------------------------------------------
    print("CONCURRENCY TEST")
    print("Each test simulates N users launching a simulation simultaneously.")
    print("All requests execute in parallel using thread pool.")
    print()
    
    concurrency_results = []
    
    for users in CONCURRENT_USERS_LEVELS:
        print(f"Testing with {users} concurrent user(s)...", flush=True)
        stats = run_concurrency_test(users, asset, algo['id'], algo['params'], sim_start, sim_end)
        
        if not stats["success"]:
            print(f"  FAILED - {stats['errors']} errors")
            continue
        
        concurrency_results.append(stats)
        print(f"  OK - Completed in {stats['batch_wall_time']:.2f}s")
        print(f"    - Throughput: {stats['throughput']:.2f} req/s")
        print(f"    - Latency (mean): {stats['latency_mean']:.2f}s")
        print()
        
        # Cooldown between tests
        time.sleep(2)
    
    # ----------------------------------------------------------------
    # Output Results Table
    # ----------------------------------------------------------------
    print()
    print("=" * 80)
    print("DETAILED RESULTS")
    print("=" * 80)
    print()
    
    print("METRIC DEFINITIONS:")
    print("  - Users: Number of concurrent simulations launched in parallel")
    print("  - Batch Time: Wall-clock time from start until last request completes")
    print("  - Latency Mean: Average time each individual request took to execute")
    print("  - Latency P95: 95th percentile latency (95% of requests faster than this)")
    print("  - Throughput: Requests completed per second (Users / Batch Time)")
    print()
    
    # Create summary table
    table_data = []
    for r in concurrency_results:
        table_data.append({
            "Users": r["users"],
            "Batch Time (s)": f"{r['batch_wall_time']:.2f}",
            "Latency Mean (s)": f"{r['latency_mean']:.2f}",
            "Latency P95 (s)": f"{r['latency_p95']:.2f}",
            "Throughput (req/s)": f"{r['throughput']:.2f}",
            "Errors": r["errors"]
        })
    
    print(tabulate(table_data, headers="keys", tablefmt="grid"))
    print()
    
    # Analysis
    print("=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    print()
    
    if len(concurrency_results) >= 2:
        first = concurrency_results[0]
        last = concurrency_results[-1]
        
        print(f"Scalability:")
        print(f"  - Single user baseline: {first['latency_mean']:.2f}s per simulation")
        print(f"  - {last['users']} concurrent users: {last['latency_mean']:.2f}s per simulation")
        print(f"  - Latency increase: {(last['latency_mean'] / first['latency_mean'] - 1) * 100:.1f}%")
        print()
        
        print(f"Throughput:")
        print(f"  • Baseline: {first['throughput']:.2f} req/s")
        print(f"  • Peak ({last['users']} users): {last['throughput']:.2f} req/s")
        print(f"  • Throughput gain: {(last['throughput'] / first['throughput']):.2f}x")
        print()
        
        print("Bottleneck Analysis:")
        avg_throughput = statistics.mean([r['throughput'] for r in concurrency_results])
        print(f"  - Average throughput across all tests: {avg_throughput:.2f} req/s")
        
        if avg_throughput < 2.0:
            print(f"  - Primary bottleneck: CPU-bound computation")
            print(f"    (Backtest calculations dominate, limited by CPU cores)")
        else:
            print(f"  - Primary bottleneck: I/O or Database")
        
        print()
        print(f"  - CPU cores available: {psutil.cpu_count(logical=False)} physical")
        print(f"  - Theoretical max parallel simulations: ~{psutil.cpu_count(logical=True)}")
    
    print()
    print("=" * 80)
    print("BENCHMARK COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
