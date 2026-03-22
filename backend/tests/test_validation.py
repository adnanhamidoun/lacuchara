"""Validation script for API and database integration checks.

Run with:
    python backend/tests/test_validation.py
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

print("\n" + "=" * 80)
print("INTEGRATION VALIDATION - AZCA Prediction API")
print("=" * 80 + "\n")

print("Test 1: Import base modules")
try:
    from dotenv import load_dotenv

    print("  dotenv imported")
    load_dotenv(project_root / ".env")
    print("  Environment variables loaded")
except Exception as exc:
    print(f"  Error: {exc}")
    sys.exit(1)

print("\nTest 2: Validate DB configuration")
try:
    import os

    db_server = os.getenv("DB_SERVER")
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")

    if db_server and db_name and db_user:
        print(f"  DB_SERVER: {db_server}")
        print(f"  DB_NAME: {db_name}")
        print(f"  DB_USER: {db_user}")
    else:
        print("  Some DB variables are empty (normal on first local run)")
except Exception as exc:
    print(f"  Error: {exc}")

print("\nTest 3: Import DB modules")
try:
    from backend.db.database import engine

    print("  database.py imported")
    from backend.db.models import PredictionLog

    print("  models.py imported")
    from backend.db import get_db, init_db

    print("  DB helper functions imported")
except Exception as exc:
    print(f"  Error: {exc}")
    sys.exit(1)

print("\nTest 4: Import prediction engine")
try:
    from backend.core import PredictionEngine

    print("  PredictionEngine imported")
except Exception as exc:
    print(f"  Error: {exc}")
    sys.exit(1)

print("\nTest 5: Import FastAPI app")
try:
    from backend.api.main import app, PredictionRequest, PredictionResponse

    print("  FastAPI app imported")
    print("  Pydantic models imported")
except Exception as exc:
    print(f"  Error: {exc}")
    sys.exit(1)

print("\nTest 6: Validate Pydantic schema")
try:
    from datetime import date

    request_data = {
        "service_date": date(2026, 3, 15),
        "max_temp_c": 28.5,
        "precipitation_mm": 0.0,
        "is_stadium_event": False,
        "is_payday_week": True,
        "restaurant_id": 1,
    }

    prediction_request = PredictionRequest(**request_data)
    print(f"  PredictionRequest valid: {prediction_request}")
except Exception as exc:
    print(f"  Validation error: {exc}")
    sys.exit(1)

print("\nTest 7: Verify FastAPI endpoints")
try:
    routes = [route.path for route in app.routes]
    expected_routes = ["/health", "/predict"]

    for route in expected_routes:
        if any(route in r for r in routes):
            print(f"  Endpoint {route} registered")
        else:
            print(f"  Endpoint {route} not found")
except Exception as exc:
    print(f"  Error: {exc}")

print("\nTest 8: Optional DB connectivity check")
try:
    import os

    db_server = os.getenv("DB_SERVER") or ""
    if "your_server" in db_server or not db_server:
        print("  DB credentials not configured (use real .env values)")
    else:
        print("  Attempting DB connection...")
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
                print("  Connection successful")
        except Exception as db_error:
            print(f"  Could not connect: {str(db_error)[:100]}")
            print("  (This can be normal if credentials are invalid)")
except Exception as exc:
    print(f"  Error: {exc}")

print("\n" + "=" * 80)
print("VALIDATION COMPLETE")
print("=" * 80)
print(
    """
Next steps:
1. Configure a real .env with Azure SQL credentials.
2. Run API:
   uvicorn backend.api.main:app --reload
3. Try endpoints:
   GET  http://localhost:8000/health
   POST http://localhost:8000/predict
4. Open API docs:
   http://localhost:8000/docs
5. Run tests:
   pytest backend/tests/
"""
)
print("=" * 80 + "\n")
