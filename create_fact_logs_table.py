#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para crear la tabla fact_prediction_logs en Azure SQL Server
"""

from sqlalchemy import create_engine, text
import os

# Configuración de conexión
connection_string = "mssql+pyodbc:///?odbc_connect=DRIVER={ODBC Driver 17 for SQL Server};Server=tcp:azcasqlserver.database.windows.net,1433;Database=azca_db;Uid=azca_user;Pwd=Azca@2024!;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"

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
