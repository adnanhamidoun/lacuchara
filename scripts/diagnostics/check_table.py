#!/usr/bin/env python3
import sys
from pathlib import Path
from sqlalchemy import inspect

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import SessionLocal

try:
    db = SessionLocal()
    
    # Usar inspection para obtener las columnas de fact_prediction_logs
    inspector = inspect(db.bind)
    columns = inspector.get_columns('fact_prediction_logs')
    
    print("\n🔍 ESTRUCTURA DE TABLE [dbo].[fact_prediction_logs]:\n")
    for col in columns:
        print(f"  - {col['name']:30} {str(col['type']):25} nullable={col['nullable']}")
    
    print("\n✅ Tabla encontrada en Azure SQL")
    db.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
