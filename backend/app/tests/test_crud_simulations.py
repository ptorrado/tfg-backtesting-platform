import pytest
from datetime import date, datetime
from unittest.mock import MagicMock, ANY

from app import models
from app.db.crud_simulations import _normalize_date, save_simulation

# --- Tests for _normalize_date ---

def test_normalize_date_str():
    assert _normalize_date("2023-01-01") == date(2023, 1, 1)

def test_normalize_date_datetime():
    dt = datetime(2023, 1, 1, 12, 0, 0)
    assert _normalize_date(dt) == date(2023, 1, 1)

def test_normalize_date_date():
    d = date(2023, 1, 1)
    assert _normalize_date(d) == d

def test_normalize_date_invalid():
    with pytest.raises(TypeError):
        _normalize_date(12345)

# --- Tests for save_simulation ---

def test_save_simulation_new_asset():
    mock_db = MagicMock()
    # Mock db.refresh to set ID on new objects
    def refresh_side_effect(obj):
        if not hasattr(obj, 'id') or obj.id is None:
            obj.id = 1
    mock_db.refresh.side_effect = refresh_side_effect
    # Mock query returning None (Asset not found)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    data = {
        "asset_symbol": "AAPL",
        "asset_name": "Apple Inc.",
        "start_date": "2023-01-01",
        "end_date": "2023-01-31",
        "algorithm": "test_algo",
        "initial_capital": 10000,
        "final_equity": 10500,
        "total_return": 0.05,
    }

    sim = save_simulation(mock_db, data)

    # Verify Asset was added
    assert mock_db.add.call_count >= 2 # Asset + Simulation
    
    # Verify we tried to find the asset
    mock_db.query.assert_any_call(models.Asset)
    
    # Verify Simulation attributes
    assert sim.asset_id is not None # In a real DB this is set, here it might depend on how we mock or if we care
    assert sim.initial_capital == 10000.0
    assert sim.algorithm == "test_algo"

def test_save_simulation_existing_asset():
    mock_db = MagicMock()
    existing_asset = models.Asset(id=1, symbol="AAPL", name="Apple")
    
    # Mock query returning existing asset
    mock_db.query.return_value.filter.return_value.first.return_value = existing_asset
    
    data = {
        "asset_symbol": "AAPL",
        "start_date": "2023-01-01",
        "end_date": "2023-01-31",
        "algorithm": "test_algo",
        "initial_capital": 10000,
        "final_equity": 10500,
    }

    sim = save_simulation(mock_db, data)

    # Asset should NOT be added again
    # We expect db.add(sim) only, so call count 1? 
    # Actually logic says: db.add(sim). 
    # existing asset path does not call db.add(asset).
    
    # Check that we didn't try to add an Asset object (heuristic)
    # or just check call count if we assume strict calls
    
    # Verify simulation was linked to existing asset
    assert sim.asset_id == 1

def test_save_simulation_equity_trades():
    mock_db = MagicMock()
    existing_asset = models.Asset(id=1, symbol="AAPL")
    mock_db.query.return_value.filter.return_value.first.return_value = existing_asset
    
    data = {
        "asset_symbol": "AAPL",
        "start_date": "2023-01-01",
        "end_date": "2023-01-02",
        "algorithm": "test_algo",
        "initial_capital": 1000,
        "final_equity": 1100,
        "equity_curve": [
            {"date": "2023-01-01", "equity": 1000},
            {"date": "2023-01-02", "equity": 1100}
        ],
        "trades": [
            {"date": "2023-01-01", "type": "buy", "price": 100, "quantity": 10, "profit_loss": 0}
        ]
    }

    save_simulation(mock_db, data)

    # Check that bulk_save_objects was called for equity and trades
    assert mock_db.bulk_save_objects.call_count == 2
