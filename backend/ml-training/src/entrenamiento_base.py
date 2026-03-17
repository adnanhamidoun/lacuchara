import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.multioutput import MultiOutputClassifier
from xgboost import XGBClassifier # Cambiamos el motor a XGBoost
from sklearn.metrics import accuracy_score
import joblib

# 1. Cargar el dataset NUEVO
df = pd.read_csv('dataset_entrenamiento_menus_v2.csv')

# 2. Encoders (Añadimos el de cuisine_type)
le_cuisine = LabelEncoder()
le_first = LabelEncoder()
le_second = LabelEncoder()
le_dessert = LabelEncoder()

df['cuisine_encoded'] = le_cuisine.fit_transform(df['cuisine_type'])
df['first_encoded'] = le_first.fit_transform(df['first_course'])
df['second_encoded'] = le_second.fit_transform(df['second_course'])
df['dessert_encoded'] = le_dessert.fit_transform(df['dessert'])

# 3. Definir X e y (¡IMPORTANTE: Incluimos restaurant_id!)
# Estas son las "pistas" que le damos a la IA
features = ['restaurant_id', 'month', 'day_of_week', 'max_temp_c', 'is_holiday', 'is_business_day', 'cuisine_encoded']
X = df[features]
y = df[['first_encoded', 'second_encoded', 'dessert_encoded']]

# 4. Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Modelo con XGBoost (Más potencia de fuego)
# Usamos MultiOutput porque queremos predecir 3 platos a la vez
xgb = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42)
model_v2 = MultiOutputClassifier(xgb, n_jobs=-1)

print("🚀 Entrenando el Vigardo 2.0 Pro con XGBoost...")
model_v2.fit(X_train, y_train)

# 6. Evaluación
y_pred = model_v2.predict(X_test)
print("-" * 30)
print(f"✅ Precisión Primero: {accuracy_score(y_test.iloc[:, 0], y_pred[:, 0]):.2f}")
print(f"✅ Precisión Segundo: {accuracy_score(y_test.iloc[:, 1], y_pred[:, 1]):.2f}")
print(f"✅ Precisión Postre: {accuracy_score(y_test.iloc[:, 2], y_pred[:, 2]):.2f}")
print("-" * 30)

# 7. Guardar artefactos
joblib.dump(model_v2, 'model_menus_v2.pkl')
encoders = {'cuisine': le_cuisine, 'first': le_first, 'second': le_second, 'dessert': le_dessert}
joblib.dump(encoders, 'label_encoders_menus_v2.pkl')

# --- PRUEBA DE FUEGO ---
# Vamos a ver si recuerda la "manía" del Restaurante ID 1
res_id_test = 1
tipo_test = df[df['restaurant_id'] == res_id_test]['cuisine_type'].iloc[0]

prueba = pd.DataFrame([[
    res_id_test, 
    7, # Julio
    0, # Lunes
    32.0, # Calor
    0, # No festivo
    1, # Business day
    le_cuisine.transform([tipo_test])[0]
]], columns=features)

pred = model_v2.predict(prueba)

print(f"\n🔮 Predicción para Restaurante {res_id_test} ({tipo_test}) en Julio:")
print(f"🍴 Primero: {le_first.inverse_transform([pred[0][0]])[0]}")
print(f"🍴 Segundo: {le_second.inverse_transform([pred[0][1]])[0]}")
print(f"🍴 Postre: {le_dessert.inverse_transform([pred[0][2]])[0]}")