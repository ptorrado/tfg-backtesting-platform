from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.models import Simulation

import pytest

@pytest.fixture
def client():
    # We could also mock check_db_connection here if needed
    with patch("app.core.health.check_db_connection"):
        return TestClient(app)

def test_list_simulations(client):
    # Mock the service layer call
    with patch("app.api.endpoints.simulations.list_simulations") as mock_list_sim:
        from datetime import date, datetime
        
        sim1 = AlchemyMagicMock(id=1, asset__symbol="AAPL", algorithm="algo1", status="completed")
        sim1.created_at = datetime(2023, 1, 1, 12, 0, 0) 
        sim1.start_date = date(2023, 1, 1)
        sim1.end_date = date(2023, 1, 31)
        sim1.initial_capital = 10000.0
        sim1.profit_loss = 500.0
        sim1.profit_loss_percentage = 5.0
        sim1.asset = "AAPL" 
        sim1.params = {}
        sim1.batch_name = None
        sim1.batch_group_id = None
        sim1.benchmark = None

        sim2 = AlchemyMagicMock(id=2, asset__symbol="BTC", algorithm="algo2", status="pending")
        sim2.created_at = datetime(2023, 1, 2, 12, 0, 0)
        sim2.start_date = date(2023, 1, 1)
        sim2.end_date = date(2023, 1, 31)
        sim2.initial_capital = 10000.0
        sim2.profit_loss = 0.0
        sim2.profit_loss_percentage = 0.0
        sim2.asset = "BTC"
        sim2.params = {}
        sim2.batch_name = None
        sim2.batch_group_id = None
        sim2.benchmark = None

        mock_list_sim.return_value = [sim1, sim2]

        mock_list_sim.return_value = [sim1, sim2]
        
        # We also need to override get_db because the endpoint requires it
        mock_db = MagicMock()
        from app.db import get_db
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            response = client.get("/simulations")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            # Check basic fields (schema transformation might vary, assuming simple mapping)
        finally:
            app.dependency_overrides = {}

def test_run_simulation(client):
    with patch("app.api.endpoints.simulations.run_and_store_simulation") as mock_run:
        from datetime import date
        sim_mock = AlchemyMagicMock(id=123, status="completed", asset_id=1)
        sim_mock.created_at = date(2023, 1, 1)
        sim_mock.start_date = date(2023, 1, 1)
        sim_mock.end_date = date(2023, 1, 31)
        sim_mock.initial_capital = 10000.0
        sim_mock.final_equity = 11000.0
        sim_mock.total_return = 0.1
        sim_mock.max_drawdown = 0.05
        sim_mock.sharpe_ratio = 1.5
        sim_mock.number_of_trades = 10
        sim_mock.winning_trades = 5
        sim_mock.losing_trades = 5
        sim_mock.accuracy = 0.5
        sim_mock.asset = "AAPL"
        sim_mock.algorithm = "test_algo"
        sim_mock.equity_curve = []
        sim_mock.trades = []
        sim_mock.benchmark = None
        sim_mock.params = {}
        sim_mock.batch_name = None
        sim_mock.batch_group_id = None
        
        mock_run.return_value = sim_mock
        
        from app.db import get_db
        app.dependency_overrides[get_db] = lambda: MagicMock()

        payload = {
            "asset": "AAPL",
            "start_date": "2023-01-01",
            "end_date": "2023-01-31",
            "algorithm": "test_algo",
            "initial_capital": 10000
        }

        try:
            response = client.post("/simulations/run", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == 123
        finally:
            app.dependency_overrides = {}

# Helper to mock SQLAlchemy objects which allow attribute access
class AlchemyMagicMock(MagicMock):
    def __getattr__(self, name):
        return super().__getattr__(name) 
    # Actually MagicMock already handles this, but schemas sometimes access properties distinctively
    # For Pydantic `from_attributes=True` (orm_mode), it just reads attributes.
    # MagicMock works fine if we configure it right.
