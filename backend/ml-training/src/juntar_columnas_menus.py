import pandas as pd
import os

# 1. Load todos los ingredientes
print("�Y"- Cargando archivos...")
df_headers = pd.read_csv('fact_menus.csv')
df_items = pd.read_csv('fact_menu_items.csv')
df_dishes = pd.read_csv('dim_dishes.csv')
df_base = pd.read_csv('base_azca.csv') # Required for weather and days

# 2. Unir Relaciones (Hechos)
print("�Y"- Uniendo tablas...")
# Unimos Menus con sus Platos (IDs)
df_final = pd.merge(df_items, df_headers, on='menu_id')

# Join with catalog to get type (first_course, etc)
df_final = pd.merge(df_final, df_dishes, on='dish_id')

# Join with base to recover weather and day (using date_id and restaurant_id)
# Nos quedamos solo con las columnas que aportan inteligencia
df_base_features = df_base[['date_id', 'restaurant_id', 'day_of_week', 'month', 'max_temp_c', 'cuisine_type']]
df_final = pd.merge(df_final, df_base_features, on=['date_id', 'restaurant_id'])

# 3. FULL CLEANUP (to avoid discussed data leakage)
print("�Y�� Limpiando columnas de trampa...")

columnas_a_mantener = [
    'day_of_week', 
    'month', 
    'max_temp_c', 
    'restaurant_id', 
    'cuisine_type', 
    'course_type', # Key feature (signal for ML model)
    'dish_id'      # TARGET (Lo que queremos predecir)
]

df_training = df_final[columnas_a_mantener]

# 4. Save final file
nombre_salida = 'automl_training_flat.csv'
df_training.to_csv(nombre_salida, index=False)

print(f"\n�o. ¡Listo! Archivo '{nombre_salida}' generado con {len(df_training)} filas.")
print(f"�Ys? Now upload this CSV to Azure AutoML and set 'dish_id' as target.")


