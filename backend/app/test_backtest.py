# app/test_backtest.py
from datetime import date
from app.backtest.engine import run_backtest

res = run_backtest(
    asset_symbol="AAPL",
    algorithm="sma_crossover",
    start_date=date(2020, 1, 1),
    end_date=date(2021, 1, 1),
    initial_capital=10000,
    params={"fast_period": 20, "slow_period": 50},
)

print(res["metrics"])
print(len(res["equity_curve"]), "puntos de equity")
print(len(res["trades"]), "trades")
