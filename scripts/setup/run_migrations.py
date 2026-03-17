#!/usr/bin/env python
"""
Script para ejecutar migraciones SQL en Azure SQL.
Agrega la columna image_data a dim_restaurants.
"""

import sys
from pathlib import Path
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from db.database import engine

def add_image_data_column():
    """Agregar columna image_data si no existe"""
    try:
        with engine.connect() as connection:
            # Verificar si la columna ya existe
            result = connection.execute(text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'dim_restaurants' AND COLUMN_NAME = 'image_data'
            """))
            
            if result.fetchone():
                print("✅ Columna 'image_data' ya existe")
                return True
            
            # Agregar columna
            print("📝 Agregando columna 'image_data' a dim_restaurants...")
            connection.execute(text("""
                ALTER TABLE dim_restaurants
                ADD image_data VARBINARY(MAX) NULL
            """))
            connection.commit()
            print("✅ Columna 'image_data' agregada correctamente")
            return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Ejecutando migraciones...")
    if add_image_data_column():
        print("✅ Migraciones completadas")
        exit(0)
    else:
        print("❌ Error en migraciones")
        exit(1)
