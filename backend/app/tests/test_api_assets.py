from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.api.endpoints.assets import get_db
from app.models import Asset

import pytest

@pytest.fixture
def client():
    # We could also mock check_db_connection here if needed
    with MagicMock():  # We might need patch, but let's consistency with prev file
        # Actually in test_api_simulations we used patch.
        # But here let's just use TestClient(app) inside fixture, 
        # and maybe mock check_db_connection in a broader scope or rely on dependency_overrides?
        # Actually simplest is just copy the pattern:
        pass # Placeholder, real code below
    return TestClient(app)

# Better pattern consistent with test_api_simulations
@pytest.fixture
def client():
    from unittest.mock import patch
    with patch("app.core.health.check_db_connection"):
        return TestClient(app)

def test_list_assets_empty(client):
    mock_db = MagicMock()
    mock_db.query.return_value.order_by.return_value.all.return_value = []

    # Use dependency override
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/assets")
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides = {}

def test_list_assets_populated(client):
    mock_db = MagicMock()
    asset1 = Asset(id=1, symbol="AAPL", name="Apple", asset_type="stock")
    asset2 = Asset(id=2, symbol="BTC", name="Bitcoin", asset_type="crypto")
    mock_db.query.return_value.order_by.return_value.all.return_value = [asset1, asset2]

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        response = client.get("/assets")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["symbol"] == "AAPL"
        assert data[1]["symbol"] == "BTC"
    finally:
        app.dependency_overrides = {}
