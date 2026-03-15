#!/usr/bin/env python3
"""
Script de prueba para verificar que las predicciones se guardan en fact_prediction_logs
"""
from datetime import date
from sqlalchemy import text
from backend.db.database import SessionLocal
from backend.db.models import FactPredictionLog

def test_prediction_logging():
    """Verifica que las predicciones se están guardando correctamente"""
    
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("🧪 TEST: Verificando fact_prediction_logs")
        print("="*80)
        
        # 1. Contar registros totales
        total_count = db.query(FactPredictionLog).count()
        print(f"\n📊 Total de registros en fact_prediction_logs: {total_count}")
        
        # 2. Mostrar los últimos 5 registros
        print(f"\n📝 Últimos 5 registros:")
        recent_logs = db.query(FactPredictionLog).order_by(
            FactPredictionLog.prediction_id.desc()
        ).limit(5).all()
        
        if recent_logs:
            for log in recent_logs:
                print(f"\n  ID: {log.prediction_id}")
                print(f"     Fecha: {log.execution_date}")
                print(f"     Restaurante: {log.restaurant_id}")
                print(f"     Tipo: {log.prediction_domain}")
                print(f"     Modelo: {log.model_version}")
                print(f"     Latencia: {log.latency_ms}ms")
                print(f"     Input JSON (primeros 100 chars): {log.input_context_json[:100]}...")
                print(f"     Output JSON (primeros 100 chars): {log.output_results_json[:100]}...")
        else:
            print("\n  ⚠️  No hay registros en fact_prediction_logs")
        
        # 3. Contar por tipo de predicción
        print(f"\n📈 Registros por tipo de predicción:")
        query = text("""
            SELECT prediction_domain, COUNT(*) as count
            FROM fact_prediction_logs
            GROUP BY prediction_domain
            ORDER BY count DESC
        """)
        results = db.execute(query).fetchall()
        
        if results:
            for domain, count in results:
                print(f"     {domain:20} → {count:4} registros")
        else:
            print("     (sin datos)")
        
        print("\n" + "="*80 + "\n")
        
        db.close()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.close()

if __name__ == "__main__":
    test_prediction_logging()
