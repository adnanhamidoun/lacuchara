#!/usr/bin/env python3
"""Test script to verify predictions are persisted in fact_prediction_logs."""
import sys
from pathlib import Path
from datetime import date
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import SessionLocal
from backend.db.models import FactPredictionLog

def test_prediction_logging():
    """Verify predictions are being saved correctly."""
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("TEST: Verify fact_prediction_logs")
        print("="*80)
        
        # 1. Count total records
        total_count = db.query(FactPredictionLog).count()
        print(f"\nTotal records in fact_prediction_logs: {total_count}")
        
        # 2. Show latest 5 records
        print("\nLatest 5 records:")
        recent_logs = db.query(FactPredictionLog).order_by(
            FactPredictionLog.prediction_id.desc()
        ).limit(5).all()
        
        if recent_logs:
            for log in recent_logs:
                print(f"\n  ID: {log.prediction_id}")
                print(f"     Date: {log.execution_date}")
                print(f"     Restaurant: {log.restaurant_id}")
                print(f"     Domain: {log.prediction_domain}")
                print(f"     Model: {log.model_version}")
                print(f"     Latency: {log.latency_ms}ms")
                print(f"     Input JSON (first 100 chars): {log.input_context_json[:100]}...")
                print(f"     Output JSON (first 100 chars): {log.output_results_json[:100]}...")
        else:
            print("\n  No records found in fact_prediction_logs")
        
        # 3. Count by prediction domain
        print("\nRecords by prediction domain:")
        query = text("""
            SELECT prediction_domain, COUNT(*) as count
            FROM fact_prediction_logs
            GROUP BY prediction_domain
            ORDER BY count DESC
        """)
        results = db.execute(query).fetchall()
        
        if results:
            for domain, count in results:
                print(f"     {domain:20} -> {count:4} records")
        else:
            print("     (no data)")
        
        print("\n" + "="*80 + "\n")
        
        db.close()
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        db.close()

if __name__ == "__main__":
    test_prediction_logging()


