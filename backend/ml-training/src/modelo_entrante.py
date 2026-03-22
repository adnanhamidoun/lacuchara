import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

# 1. Absolute path to advanced file (use mixed/shuffled one if available)
directorio_actual = os.path.dirname(os.path.abspath(__file__))
ruta_entrada = os.path.abspath(os.path.join(directorio_actual, '../../../csv/menu_history_advanced_shuffled.csv'))

df = pd.read_csv(ruta_entrada)

# 2. Definir el target y hacer DROP de lo que sobra
target = 'menu_starter'

# REMOVE: target itself to avoid leakage, and future dishes (main and dessert)
# Also remove 'restaurant_id' and 'service_date' since useful signal was extracted
columnas_a_delete = ['restaurant_id', 'service_date', 'menu_main', 'menu_dessert', target]

X = df.drop(columns=columnas_a_delete)
y = df[target]

# 3. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Pipeline: automatically detect text columns (object) for encoding
categorical_cols = X.select_dtypes(include=['object']).columns.tolist()

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1), categorical_cols)
    ], remainder='passthrough'
)

modelo_entrante = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
])

# 5. Entrenar y evaluar
print("Training Model 1: Starter...")
modelo_entrante.fit(X_train, y_train)
y_pred = modelo_entrante.predict(X_test)

print(f"�o. STARTER model accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%\n")


