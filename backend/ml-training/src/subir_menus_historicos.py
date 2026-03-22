import pandas as pd
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
import urllib

# 1. Load variables de entorno
load_dotenv()

def upload_data():
    csv_file = 'dataset_menus_final.csv'
    table_name = 'Menus_Azca'
    
    print(f"�Ys? Starting upload process for {csv_file}...")

    # 2. Leer el CSV
    if not os.path.exists(csv_file):
        print(f"�O Error: File not found {csv_file}")
        return

    df = pd.read_csv(csv_file)

    # 3. Data cleanup for SQL
    # Convert booleans (True/False) to integers (1/0) for Azure SQL BIT fields
    bool_cols = df.select_dtypes(include=['bool']).columns
    for col in bool_cols:
        df[col] = df[col].astype(int)

    # 4. Configurar connection a Azure SQL
    params = urllib.parse.quote_plus(
        f"DRIVER={os.getenv('DB_DRIVER')};"
        f"SERVER={os.getenv('DB_SERVER')};"
        f"DATABASE={os.getenv('DB_NAME')};"
        f"UID={os.getenv('DB_USER')};"
        f"PWD={os.getenv('DB_PASS')}"
    )
    
    engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

    # 5. Subir a la database
    try:
        print(f"�Y"� Connecting to Azure SQL and inserting data into table '{table_name}'...")
        
        # if_exists='replace' creates the table when it does not exist. 
        # If the table already exists with specific types, use 'append'
        df.to_sql(table_name, con=engine, if_exists='replace', index=False)
        
        print("�o. ¡�?XITO! Los datos se han subido correctamente.")
        print(f"�Y"S Total de registros subidos: {len(df)}")

    except Exception as e:
        print(f"�O Error while uploading data: {e}")

if __name__ == "__main__":
    upload_data()


