import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import urllib

# 1. Cargar variables de entorno
load_dotenv()

def upload_data():
    csv_file = 'dataset_menus_final.csv'
    table_name = 'Menus_Azca'
    
    print(f"🚀 Iniciando proceso para subir {csv_file}...")

    # 2. Leer el CSV
    if not os.path.exists(csv_file):
        print(f"❌ Error: No se encuentra el archivo {csv_file}")
        return

    df = pd.read_csv(csv_file)

    # 3. Limpieza de datos para SQL
    # Convertimos booleanos (True/False) a enteros (1/0) para que Azure SQL los acepte como BIT
    bool_cols = df.select_dtypes(include=['bool']).columns
    for col in bool_cols:
        df[col] = df[col].astype(int)

    # 4. Configurar conexión a Azure SQL
    params = urllib.parse.quote_plus(
        f"DRIVER={os.getenv('DB_DRIVER')};"
        f"SERVER={os.getenv('DB_SERVER')};"
        f"DATABASE={os.getenv('DB_NAME')};"
        f"UID={os.getenv('DB_USER')};"
        f"PWD={os.getenv('DB_PASS')}"
    )
    
    engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

    # 5. Subir a la base de datos
    try:
        print(f"📡 Conectando a Azure SQL e insertando datos en la tabla '{table_name}'...")
        
        # if_exists='replace' creará la tabla si no existe. 
        # Si ya tienes la tabla creada con tipos específicos, usa 'append'
        df.to_sql(table_name, con=engine, if_exists='replace', index=False)
        
        print("✅ ¡ÉXITO! Los datos se han subido correctamente.")
        print(f"📊 Total de registros subidos: {len(df)}")

    except Exception as e:
        print(f"❌ Error al subir los datos: {e}")

if __name__ == "__main__":
    upload_data()