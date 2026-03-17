import pandas as pd
import os

# 1. Cargar todos los ingredientes
print("📖 Cargando archivos...")
df_headers = pd.read_csv('fact_menus.csv')
df_items = pd.read_csv('fact_menu_items.csv')
df_dishes = pd.read_csv('dim_dishes.csv')
df_base = pd.read_csv('base_azca.csv') # Necesario para clima y días

# 2. Unir Relaciones (Hechos)
print("🔗 Uniendo tablas...")
# Unimos Menús con sus Platos (IDs)
df_final = pd.merge(df_items, df_headers, on='menu_id')

# Unimos con el Catálogo para saber el tipo (first_course, etc)
df_final = pd.merge(df_final, df_dishes, on='dish_id')

# Unimos con la Base para recuperar el Clima y el Día (usando date_id y restaurant_id)
# Nos quedamos solo con las columnas que aportan inteligencia
df_base_features = df_base[['date_id', 'restaurant_id', 'day_of_week', 'month', 'max_temp_c', 'cuisine_type']]
df_final = pd.merge(df_final, df_base_features, on=['date_id', 'restaurant_id'])

# 3. LIMPIEZA TOTAL (Para evitar el "Data Leakage" que comentamos)
print("🧹 Limpiando columnas de trampa...")

columnas_a_mantener = [
    'day_of_week', 
    'month', 
    'max_temp_c', 
    'restaurant_id', 
    'cuisine_type', 
    'course_type', # Feature clave (Pista para la IA)
    'dish_id'      # TARGET (Lo que queremos predecir)
]

df_training = df_final[columnas_a_mantener]

# 4. Guardar el archivo definitivo
nombre_salida = 'automl_training_flat.csv'
df_training.to_csv(nombre_salida, index=False)

print(f"\n✅ ¡Listo! Archivo '{nombre_salida}' generado con {len(df_training)} filas.")
print(f"🚀 Ahora sube este CSV a Azure AutoML y marca 'dish_id' como Target.")