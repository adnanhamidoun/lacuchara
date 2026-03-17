import pandas as pd
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

def obtener_conexion():
    server = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USER')
    password = os.getenv('DB_PASS')
    driver = os.getenv('DB_DRIVER')
    if username and "@" not in username:
        username = f"{username}@{server.split('.')[0]}"
    conn_str = f"Driver={driver};Server={server};Database={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;"
    return pyodbc.connect(conn_str)

def cargar_datos_ratings():
    csv_file = 'dataset_entrenamiento_10anios_menus.csv'
    if not os.path.exists(csv_file):
        print(f"❌ Error: No se encuentra el archivo {csv_file}")
        return

    print(f"📖 Leyendo dataset {csv_file}...")
    columnas = ['menu_date', 'restaurant_id', 'dish_id', 'target_rating']
    df = pd.read_csv(csv_file, usecols=columnas)
    
    # Limpieza inicial de la fecha
    df['date_id'] = df['menu_date'].str.replace('-', '').astype(float).astype(int)

    conn = obtener_conexion()
    cursor = conn.cursor()

    try:
        print("Verificando estructura y preparando staging...")
        cursor.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[dbo].[fact_menu_items]') AND name = 'target_rating') ALTER TABLE [dbo].[fact_menu_items] ADD target_rating FLOAT;")
        cursor.execute("IF OBJECT_ID('tempdb..#StagingRatings') IS NOT NULL DROP TABLE #StagingRatings; CREATE TABLE #StagingRatings (date_id INT, res_id INT, dish_id INT, rating FLOAT)")
        
        # 🚀 LA PARTE CRÍTICA: Convertir a tipos NATIVOS de Python uno a uno
        # Esto asegura que el valor enviado sea 20160101 y no '20160101.0'
        print(f"📦 Preparando {len(df)} filas con tipos nativos...")
        datos_nativos = [
            (int(row.date_id), int(row.restaurant_id), int(row.dish_id), float(row.target_rating))
            for row in df.itertuples(index=False)
        ]

        print("🚀 Subiendo datos al staging...")
        cursor.fast_executemany = True
        cursor.executemany("INSERT INTO #StagingRatings VALUES (?, ?, ?, ?)", datos_nativos)

        print("💉 Inyectando ratings en fact_menu_items...")
        query_update = """
            UPDATE fmi
            SET fmi.target_rating = stg.rating
            FROM [dbo].[fact_menu_items] fmi
            INNER JOIN [dbo].[fact_menus] fm ON fmi.menu_id = fm.menu_id
            INNER JOIN #StagingRatings stg ON fm.date_id = stg.date_id 
                                         AND fm.restaurant_id = stg.res_id 
                                         AND fmi.dish_id = stg.dish_id
        """
        cursor.execute(query_update)
        
        conn.commit()
        print(f"✅ ¡Éxito! Ratings actualizados correctamente.")

    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    cargar_datos_ratings()