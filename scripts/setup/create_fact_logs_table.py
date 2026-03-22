#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Create fact_prediction_logs table in Azure SQL Server if it does not exist."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

db_server = os.getenv("DB_SERVER", "azcasqlserver.database.windows.net")
db_name = os.getenv("DB_NAME", "azca_db")
db_user = os.getenv("DB_USER", "azca_user")
db_password = os.getenv("DB_PASS") or os.getenv("DB_PASSWORD")
db_driver = os.getenv("DB_DRIVER", "{ODBC Driver 17 for SQL Server}")

if not db_password:
    raise ValueError("DB_PASS/DB_PASSWORD is not configured in .env")

connection_string = (
    "mssql+pyodbc:///?odbc_connect="
    f"DRIVER={db_driver};"
    f"Server=tcp:{db_server},1433;"
    f"Database={db_name};"
    f"Uid={db_user};"
    f"Pwd={db_password};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
)

try:
    print("Connecting to Azure SQL Server...")
    engine = create_engine(connection_string)

    with engine.connect() as conn:
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

            -- Create indexes
            CREATE INDEX idx_restaurant_id ON fact_prediction_logs(restaurant_id);
            CREATE INDEX idx_execution_date ON fact_prediction_logs(execution_date);
            CREATE INDEX idx_prediction_domain ON fact_prediction_logs(prediction_domain);

            PRINT 'Table fact_prediction_logs created successfully';
        END
        ELSE
        BEGIN
            PRINT 'Table fact_prediction_logs already exists';
        END
        """

        print("Executing SQL migration...")
        conn.execute(text(create_table_sql))
        conn.commit()
        print("fact_prediction_logs table verified/created successfully")
except Exception as exc:
    print(f"Error: {exc}")
    import traceback

    traceback.print_exc()
