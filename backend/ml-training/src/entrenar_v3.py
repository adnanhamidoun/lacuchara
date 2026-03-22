import pandas as pd
import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

# 1. Load credentials
load_dotenv()

params = quote_plus(f"DRIVER={os.getenv('DB_DRIVER')};SERVER={os.getenv('DB_SERVER')};DATABASE={os.getenv('DB_NAME')};UID={os.getenv('DB_USER')};PWD={os.getenv('DB_PASS')}")
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

# 2. Read the 3 generated files
print("�Y"- Leyendo archivos normalizados...")
df_menus = pd.read_csv('fact_menus.csv')
df_dishes = pd.read_csv('dim_dishes.csv')
df_items = pd.read_csv('fact_menu_items.csv')

try:
    with engine.begin() as conn:
        # A. Subir Cabeceras (fact_menus)
        print(f"�?️ Uploading {len(df_menus)} menus...")
        conn.execute(text("SET IDENTITY_INSERT [dbo].[fact_menus] ON"))
        df_menus.to_sql('fact_menus', schema='dbo', con=conn, if_exists='append', index=False)
        conn.execute(text("SET IDENTITY_INSERT [dbo].[fact_menus] OFF"))

        # B. Upload catalog (dim_dishes)
        print(f"�?️ Uploading catalog of {len(df_dishes)} dishes...")
        conn.execute(text("SET IDENTITY_INSERT [dbo].[dim_dishes] ON"))
        df_dishes.to_sql('dim_dishes', schema='dbo', con=conn, if_exists='append', index=False)
        conn.execute(text("SET IDENTITY_INSERT [dbo].[dim_dishes] OFF"))

        # C. Subir Relaciones (fact_menu_items)
        print(f"�?️ Uploading {len(df_items)} menu-dish relations...")
        # IDENTITY_INSERT is not enabled here because SQL auto-generates item_id
        df_items.to_sql('fact_menu_items', schema='dbo', con=conn, if_exists='append', index=False)

    print("\n�Ys? Upload complete! Azure SQL now has normalized V3 structure.")

except Exception as e:
    print(f"�O Error during upload: {e}")



