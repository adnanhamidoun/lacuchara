#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Inspect recent rows in fact_prediction_logs."""

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

conn_str = (
    "mssql+pyodbc:///?odbc_connect="
    f"DRIVER={db_driver};"
    f"Server=tcp:{db_server},1433;"
    f"Database={db_name};"
    f"Uid={db_user};"
    f"Pwd={db_password};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
)

try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM fact_prediction_logs")).scalar()
        print(f"Total rows in fact_prediction_logs: {total}")

        latest_rows = conn.execute(
            text(
                """
                SELECT TOP 5 prediction_id, execution_date, restaurant_id,
                       prediction_domain, model_version, latency_ms
                FROM fact_prediction_logs
                ORDER BY prediction_id DESC
                """
            )
        ).fetchall()

        if latest_rows:
            print(f"\nLatest {len(latest_rows)} saved predictions:\n")
            print(f"{'ID':<6} {'Domain':<20} {'Restaurant':<12} {'Latency(ms)':<12} {'Model':<25}")
            print("=" * 80)

            for row in latest_rows:
                pred_id, _, rest_id, domain, model, latency = row
                latency_text = str(latency) if latency is not None else "N/A"
                model_text = model if model else "N/A"
                print(f"{pred_id:<6} {domain:<20} {rest_id:<12} {latency_text:<12} {model_text:<25}")

            latest_id = latest_rows[0][0]
            print(f"\nLatest prediction details (ID {latest_id}):")
            detail = conn.execute(
                text(
                    """
                    SELECT input_context_json, output_results_json
                    FROM fact_prediction_logs
                    WHERE prediction_id = :prediction_id
                    """
                ),
                {"prediction_id": latest_id},
            ).fetchone()
            if detail:
                print(f"  Input (first 150 chars): {detail[0][:150]}...")
                print(f"  Output: {detail[1]}")
        else:
            print("No rows found in fact_prediction_logs")
except Exception as exc:
    print(f"Error: {exc}")
    import traceback

    traceback.print_exc()
