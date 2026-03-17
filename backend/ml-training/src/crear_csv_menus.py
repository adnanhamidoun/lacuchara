import pandas as pd

df = pd.read_csv('dataset_menus_final.csv')

# Columnas comunes que siempre queremos
features_comunes = ['day_of_week', 'month', 'max_temp_c', 'is_holiday', 'is_business_day', 'restaurant_id', 'cuisine_type', 'restaurant_segment']

# Crear y guardar los 3 datasets
df[features_comunes + ['first_course']].to_csv('data_starter_clean.csv', index=False)
df[features_comunes + ['second_course']].to_csv('data_main_clean.csv', index=False)
df[features_comunes + ['dessert']].to_csv('data_dessert_clean.csv', index=False)

print("¡Datasets listos para la batalla!")