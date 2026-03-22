import pandas as pd

# 1. Load data that already includes "previous day" and "last week" columns
df = pd.read_csv('../../../csv/menu_history_advanced_features.csv')

# 2. Mezclar (shuffle) el 100% de las filas de forma aleatoria
# frac=1 means we sample 100% of rows
# random_state=42 es la "semilla", asegura que siempre se mezcle de la misma forma si lo repites
df_shuffled = df.sample(frac=1, random_state=42).reset_index(drop=True)

# 3. Save the new dataset mezclado y definitivo
output_file = 'menu_history_advanced_shuffled.csv'
df_shuffled.to_csv(output_file, index=False)

print("Data shuffled successfully!")
print("\nFirst 5 rows of new dataset (note how 'restaurant_id' values are now shuffled):")
print(df_shuffled[['restaurant_id', 'service_date', 'menu_starter']].head())


