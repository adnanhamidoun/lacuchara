#!/usr/bin/env python3
"""
Test directo de save_prediction_log sin necesidad de servidor HTTP
"""
import sys
from pathlib import Path
from datetime import date, timedelta

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import SessionLocal
from backend.api.main import save_prediction_log

db = SessionLocal()

print("\n" + "="*80)
print("�Y�� TEST DIRECTO: Llamando save_prediction_log")
print("="*80)

# Datos de test
test_input = {
    "day_of_week": 0,
    "month": 3,
    "max_temp_c": 22.5,
    "precipitation_mm": 0,
    "is_holiday": 0,
    "is_payday_week": 1,
    "is_stadium_event": 0,
    "is_azca_event": 0,
    "restaurant_id": 1,
    "cuisine_type": "spanish",
    "restaurant_segment": "premium",
    "terrace_setup_type": "full",
    "menu_price": 35.0,
    "course_type": "first_course",
    "prev_dish_id": 0.0,
}

test_output = [(1, 0.45), (2, 0.35), (3, 0.20)]

print(f"\n�Y"� Saving prediction...")
print(f"   Restaurant ID: 1")
print(f"   Tipo: MENU_STARTER")
print(f"   Entrada: {len(test_input)} features")
print(f"   Salida: {len(test_output)} dishes")

try:
    prediction_id = save_prediction_log(
        db=db,
        restaurant_id=1,
        prediction_domain="MENU_STARTER",
        input_context=test_input,
        output_results=test_output,
        model_version="test_v1",
        latency_ms=145
    )
    
    if prediction_id > 0:
        print(f"\n�o. GUARDADO EXITOSO!")
        print(f"   Prediction ID: {prediction_id}")
    else:
        print(f"\n�O FALLO AL GUARDAR (prediction_id = {prediction_id})")
        
except Exception as e:
    print(f"\n�O EXCEPCI�"N: {str(e)}")
    import traceback
    traceback.print_exc()

finally:
    db.close()

print("\n" + "="*80)
print("Verifying it was saved in DB...")
print("="*80 + "\n")

# Verify
from backend.db.models import FactPredictionLog

db2 = SessionLocal()
try:
    total = db2.query(FactPredictionLog).count()
    print(f"�Y"S Total de registros: {total}")
    
    if total > 0:
        latest = db2.query(FactPredictionLog).order_by(
            FactPredictionLog.prediction_id.desc()
        ).first()
        
        print(f"\n�o. �sLTIMO REGISTRO:")
        print(f"   ID: {latest.prediction_id}")
        print(f"   Date: {latest.execution_date}")
        print(f"   Rest: {latest.restaurant_id}")
        print(f"   Tipo: {latest.prediction_domain}")
        print(f"   Modelo: {latest.model_version}")
        print(f"   Latencia: {latest.latency_ms}ms")
        
finally:
    db2.close()

print("\n")




