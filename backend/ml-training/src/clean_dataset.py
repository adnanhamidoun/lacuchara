import pandas as pd
import os

# 1. Configuration de nombres
archivo_entrada = 'dataset_entrenamiento_menus_v2.csv'
archivo_salida = 'dataset_menus_final.csv'

if not os.path.exists(archivo_entrada):
    print(f"�O File not found {archivo_entrada}")
else:
    # 2. Load data
    df = pd.read_csv(archivo_entrada)
    print(f"�Y"< Filas originales: {len(df)}")

    # 3. Columns to delete (redundant for ML)
    # Quitamos date_id y service_date porque ya tenemos month y day_of_week
    cols_to_drop = ['date_id', 'service_date']
    
    # Solo las borramos si existen en el DataFrame
    df_final = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

    # 4. Save the "Vigardo Gold" dataset
    df_final.to_csv(archivo_salida, index=False)
    
    print("-" * 30)
    print(f"�o. Dataset cleaned successfully!")
    print(f"�Y"� Nuevo archivo: {archivo_salida}")
    print(f"�Y"S Columnas finales: {list(df_final.columns)}")
    print("-" * 30)


