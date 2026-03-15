#!/usr/bin/env python3
"""
Script para hacer una predicción de prueba y verificar que se guarda
"""
import requests
import json
from datetime import date, timedelta

# URL del servidor
BASE_URL = "http://127.0.0.1:8000"

# Datos para una predicción de entrada
starter_request = {
    "restaurant_id": 1,
    "service_date": (date.today() + timedelta(days=1)).isoformat()
}

print("\n" + "="*80)
print("🧪 TEST: Hacer una predicción de entrada")
print("="*80)
print(f"\n📤 Enviando POST a {BASE_URL}/predict/starter")
print(f"   Datos: {json.dumps(starter_request, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/predict/starter",
        json=starter_request,
        timeout=10
    )
    
    print(f"\n✅ Respuesta: {response.status_code}")
    print(f"   {json.dumps(response.json(), indent=2)}")
    
    if response.status_code in [200, 201]:
        print("\n✅ Predicción exitosa!")
    else:
        print(f"\n❌ Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ Error en la solicitud: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*80)
print("Esperando 2 segundos para que se escriba en la BD...")
print("="*80 + "\n")

import time
time.sleep(2)

# Ahora verificar que se guardó en la BD
print("\n📊 Verificando que se guardó en fact_prediction_logs...\n")

from backend.db.database import SessionLocal
from backend.db.models import FactPredictionLog

db = SessionLocal()

try:
    total = db.query(FactPredictionLog).count()
    print(f"Total de registros en fact_prediction_logs: {total}")
    
    if total > 0:
        latest = db.query(FactPredictionLog).order_by(
            FactPredictionLog.prediction_id.desc()
        ).first()
        
        print(f"\n✅ ÚLTIMÍSIMO REGISTRO GUARDADO:")
        print(f"   ID: {latest.prediction_id}")
        print(f"   Fecha: {latest.execution_date}")
        print(f"   Restaurante: {latest.restaurant_id}")
        print(f"   Tipo: {latest.prediction_domain}")
        print(f"   Modelo: {latest.model_version}")
        print(f"   Latencia: {latest.latency_ms}ms")
        print(f"   Input: {latest.input_context_json[:150]}...")
        print(f"   Output: {latest.output_results_json[:150]}...")
    else:
        print("\n⚠️  NO hay registros en fact_prediction_logs")
        print("   ¿La predicción falló silenciosamente?")
        
except Exception as e:
    print(f"❌ Error verificando BD: {str(e)}")
    
finally:
    db.close()

print("\n" + "="*80 + "\n")
