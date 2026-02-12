import pytest
from datetime import date
from unittest.mock import MagicMock, patch

from app.backtest.engine import run_backtest

# Mock the algorithm discovery to avoid loading real strategies
@patch("app.backtest.engine.get_algorithm_fn")
def test_run_backtest_calls_strategy(mock_get_algo):
    # Setup mock strategy function
    mock_strategy = MagicMock()
    mock_strategy.return_value = {"status": "ok", "final_equity": 1000}
    mock_get_algo.return_value = mock_strategy

    mock_db = MagicMock()
    
    result = run_backtest(
        db=mock_db,
        asset="AAPL",
        algorithm="test_algo",
        start_date=date(2023, 1, 1),
        end_date=date(2023, 1, 31),
        initial_capital=1000.0,
        params={"param1": 10}
    )

    # Verify get_algorithm_fn was called with correct ID
    mock_get_algo.assert_called_once_with("test_algo")

    # Verify strategy function was called with correct args
    mock_strategy.assert_called_once_with(
        mock_db,
        "AAPL",
        date(2023, 1, 1),
        date(2023, 1, 31),
        1000.0,
        {"param1": 10}
    )

    # Verify result propagation
    assert result == {"status": "ok", "final_equity": 1000}

@patch("app.backtest.engine.get_algorithm_fn")
def test_run_backtest_default_params(mock_get_algo):
    mock_strategy = MagicMock()
    mock_strategy.return_value = {}
    mock_get_algo.return_value = mock_strategy
    
    mock_db = MagicMock()

    run_backtest(
        db=mock_db,
        asset="AAPL",
        algorithm="test_algo",
        start_date=date(2023, 1, 1),
        end_date=date(2023, 1, 31),
        initial_capital=1000.0
        # params omitted
    )

    # Verify empty dict passed for params
    args, _ = mock_strategy.call_args
    assert args[5] == {} 
