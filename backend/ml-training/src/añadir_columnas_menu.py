import pandas as pd
import os

# 1. Create rutas robustas
# 'directorio_actual' es la carpeta 'menus'
directorio_actual = os.path.dirname(os.path.abspath(__file__))

# Move up two levels ('../../') to exit 'menus' and 'scripts', then enter 'csv'
ruta_entrada = os.path.abspath(os.path.join(directorio_actual, '../../../csv/menu_history_clean.csv'))
ruta_salida = os.path.abspath(os.path.join(directorio_actual, '../../../csv/menu_history_advanced_features.csv'))

# Print path to verify correct target before reading
print(f"Buscando el archivo en: {ruta_entrada}")

# 2. Load cleaned data using dynamic path
df = pd.read_csv(ruta_entrada)

# 3. Convertir la columna de date a formato 'datetime'
df['service_date'] = pd.to_datetime(df['service_date'])

# 4. Extract day of week and month
df['day_of_week'] = df['service_date'].dt.dayofweek 
df['month'] = df['service_date'].dt.month

# 5. SORT DATA (critical step)
df = df.sort_values(by=['restaurant_id', 'service_date']).reset_index(drop=True)

# 6. Create variables: "Previous-day dishes" 
df['starter_yesterday'] = df.groupby('restaurant_id')['menu_starter'].shift(1)
df['main_yesterday'] = df.groupby('restaurant_id')['menu_main'].shift(1)
df['dessert_yesterday'] = df.groupby('restaurant_id')['menu_dessert'].shift(1)

# 7. Create variables: "Last-week dishes"
df['starter_last_week'] = df.groupby(['restaurant_id', 'day_of_week'])['menu_starter'].shift(1)
df['main_last_week'] = df.groupby(['restaurant_id', 'day_of_week'])['menu_main'].shift(1)
df['dessert_last_week'] = df.groupby(['restaurant_id', 'day_of_week'])['menu_dessert'].shift(1)

# 8. Limpieza final
df.fillna('Desconocido', inplace=True)

# 9. Save the new dataset
df.to_csv(ruta_salida, index=False)

print(f"Transformation completed successfully! File saved at: {ruta_salida}")


