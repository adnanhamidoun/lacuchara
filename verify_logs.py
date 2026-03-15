#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Verificar registros en fact_prediction_logs"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Cargar variables de entorno desde .env
load_dotenv()

# Obtener credenciales desde variables de entorno
db_server = os.getenv('DB_SERVER', 'azcasqlserver.database.windows.net')
db_name = os.getenv('DB_NAME', 'azca_db')
db_user = os.getenv('DB_USER', 'azca_user')
db_password = os.getenv('DB_PASSWORD')
db_driver = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')

if not db_password:
    raise ValueError("❌ DB_PASSWORD no configurada en .env")

# Construir connection string de forma segura
conn_str = f'mssql+pyodbc:///?odbc_connect=DRIVER={db_driver};Server=tcp:{db_server},1433;Database={db_name};Uid={db_user};Pwd={db_password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'

try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        # Contar registros totales
        result = conn.execute(text('SELECT COUNT(*) as total FROM fact_prediction_logs'))
        count = result.scalar()
        print(f'✅ Total de registros en fact_prediction_logs: {count}')
        
        # Obtener últimos 5
        result2 = conn.execute(text('SELECT TOP 5 prediction_id, execution_date, restaurant_id, prediction_domain, model_version, latency_ms FROM fact_prediction_logs ORDER BY prediction_id DESC'))
        rows = result2.fetchall()
        
        if rows:
            print(f'\n📊 Últimas {len(rows)} predicciones guardadas:\n')
            print(f"{'ID':<6} {'Domain':<20} {'Restaurant':<12} {'Latency(ms)':<12} {'Model':<25}")
            print("=" * 80)
            
            for row in rows:
                pred_id = row[0]
                domain = row[3]  
                rest_id = row[2]
                model = row[4]
                latency = row[5]
                
                print(f"{pred_id:<6} {domain:<20} {rest_id:<12} {str(latency) if latency else 'N/A':<12} {model if model else 'N/A':<25}")
            
            # Mostrar detalle JSON de la última
            print(f"\n✨ Última predicción (ID {rows[0][0]}):")
            result_detail = conn.execute(text(f'SELECT input_context_json, output_results_json FROM fact_prediction_logs WHERE prediction_id = {rows[0][0]}'))
            detail = result_detail.fetchone()
            if detail:
                print(f"  Input (primeros 150 chars): {detail[0][:150]}...")
                print(f"  Output: {detail[1]}")
        else:
            print("❌ No hay registros en fact_prediction_logs")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
