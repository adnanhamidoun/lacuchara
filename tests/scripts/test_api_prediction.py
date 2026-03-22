#!/usr/bin/env python3
"""Run a starter prediction request and verify that it is persisted."""

import json
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import requests

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BASE_URL = "http://127.0.0.1:8000"

starter_request = {
    "restaurant_id": 1,
    "service_date": (date.today() + timedelta(days=1)).isoformat(),
}

print("\n" + "=" * 80)
print("TEST: Run starter prediction")
print("=" * 80)
print(f"\nSending POST to {BASE_URL}/predict/starter")
print(f"Payload: {json.dumps(starter_request, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/predict/starter",
        json=starter_request,
        timeout=10,
    )

    print(f"\nStatus: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

    if response.status_code in [200, 201]:
        print("\nPrediction succeeded")
    else:
        print(f"\nRequest failed: {response.text}")
except Exception as exc:
    print(f"\nRequest error: {exc}")
    import traceback

    traceback.print_exc()

print("\n" + "=" * 80)
print("Waiting 2 seconds for DB persistence...")
print("=" * 80 + "\n")

time.sleep(2)

print("\nVerifying fact_prediction_logs persistence...\n")

from backend.db.database import SessionLocal
from backend.db.models import FactPredictionLog

db = SessionLocal()

try:
    total = db.query(FactPredictionLog).count()
    print(f"Total rows in fact_prediction_logs: {total}")

    if total > 0:
        latest = db.query(FactPredictionLog).order_by(FactPredictionLog.prediction_id.desc()).first()

        print("\nLatest persisted record:")
        print(f"  ID: {latest.prediction_id}")
        print(f"  Date: {latest.execution_date}")
        print(f"  Restaurant: {latest.restaurant_id}")
        print(f"  Domain: {latest.prediction_domain}")
        print(f"  Model: {latest.model_version}")
        print(f"  Latency: {latest.latency_ms}ms")
        print(f"  Input: {latest.input_context_json[:150]}...")
        print(f"  Output: {latest.output_results_json[:150]}...")
    else:
        print("No records found in fact_prediction_logs")
except Exception as exc:
    print(f"DB verification error: {exc}")
finally:
    db.close()

print("\n" + "=" * 80 + "\n")
