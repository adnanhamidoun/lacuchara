import pandas as pd
import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

# 1. Cargar credenciales
load_dotenv()

params = quote_plus(f"DRIVER={os.getenv('DB_DRIVER')};SERVER={os.getenv('DB_SERVER')};DATABASE={os.getenv('DB_NAME')};UID={os.getenv('DB_USER')};PWD={os.getenv('DB_PASS')}")
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

# 2. Leer los 3 archivos generados
print("📖 Leyendo archivos normalizados...")
df_menus = pd.read_csv('fact_menus.csv')
df_dishes = pd.read_csv('dim_dishes.csv')
df_items = pd.read_csv('fact_menu_items.csv')

try:
    with engine.begin() as conn:
        # A. Subir Cabeceras (fact_menus)
        print(f"⬆️ Subiendo {len(df_menus)} menús...")
        conn.execute(text("SET IDENTITY_INSERT [dbo].[fact_menus] ON"))
        df_menus.to_sql('fact_menus', schema='dbo', con=conn, if_exists='append', index=False)
        conn.execute(text("SET IDENTITY_INSERT [dbo].[fact_menus] OFF"))

        # B. Subir Catálogo (dim_dishes)
        print(f"⬆️ Subiendo catálogo de {len(df_dishes)} platos...")
        conn.execute(text("SET IDENTITY_INSERT [dbo].[dim_dishes] ON"))
        df_dishes.to_sql('dim_dishes', schema='dbo', con=conn, if_exists='append', index=False)
        conn.execute(text("SET IDENTITY_INSERT [dbo].[dim_dishes] OFF"))

        # C. Subir Relaciones (fact_menu_items)
        print(f"⬆️ Subiendo {len(df_items)} relaciones menú-plato...")
        # Aquí no activamos IDENTITY_INSERT porque el item_id lo genera SQL solo
        df_items.to_sql('fact_menu_items', schema='dbo', con=conn, if_exists='append', index=False)

    print("\n🚀 ¡Carga completada! Azure SQL ahora tiene la estructura V3 normalizada.")

except Exception as e:
    print(f"❌ Error durante la carga: {e}")