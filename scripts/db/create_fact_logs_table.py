#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para crear la tabla fact_prediction_logs en Azure SQL Server
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Cargar variables de entorno desde .env
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

# Obtener credenciales desde variables de entorno
db_server = os.getenv('DB_SERVER', 'azcasqlserver.database.windows.net')
db_name = os.getenv('DB_NAME', 'azca_db')
db_user = os.getenv('DB_USER', 'azca_user')
db_password = os.getenv('DB_PASSWORD')
db_driver = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')

if not db_password:
    raise ValueError("❌ DB_PASSWORD no configurada en .env")

# Construir connection string de forma segura
connection_string = f'mssql+pyodbc:///?odbc_connect=DRIVER={db_driver};Server=tcp:{db_server},1433;Database={db_name};Uid={db_user};Pwd={db_password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

try:
    print("🔌 Conectando a Azure SQL Server...")
    engine = create_engine(connection_string)
    
    with engine.connect() as conn:
        # Crear tabla fact_prediction_logs
        create_table_sql = """
        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'fact_prediction_logs')
        BEGIN
            CREATE TABLE fact_prediction_logs (
                prediction_id INT IDENTITY(1,1) PRIMARY KEY,
                execution_date DATETIME DEFAULT GETDATE(),
                restaurant_id INT NOT NULL,
                prediction_domain VARCHAR(50) NOT NULL,
                input_context_json NVARCHAR(MAX) NOT NULL,
                output_results_json NVARCHAR(MAX) NOT NULL,
                model_version VARCHAR(50),
                latency_ms INT,
                actual_outcome_json NVARCHAR(MAX) NULL
            );
            
            -- Crear índices
            CREATE INDEX idx_restaurant_id ON fact_prediction_logs(restaurant_id);
            CREATE INDEX idx_execution_date ON fact_prediction_logs(execution_date);
            CREATE INDEX idx_prediction_domain ON fact_prediction_logs(prediction_domain);
            
            PRINT 'Tabla fact_prediction_logs creada exitosamente';
        END
        ELSE
        BEGIN
            PRINT 'Tabla fact_prediction_logs ya existe';
        END
        """
        
        print("📊 Ejecutando SQL para crear tabla...")
        conn.execute(text(create_table_sql))
        conn.commit()
        print("✅ Tabla fact_prediction_logs verificada/creada exitosamente")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
