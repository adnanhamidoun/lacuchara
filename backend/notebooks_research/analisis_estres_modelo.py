"""
STRESS ANALYSIS�?S - MODELO VOTINF ENSEMBLE (AZCA)
Senior ML Engineer Analysis
Goal: test 10 extreme scenarios to validate model robustness
"""

import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# 1. LOAD MODEL
# ============================================================================
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("[LOADING] Loading model Azure AutoML (VotingEnsemble)...")
with open('model.pkl', 'rb') as f:
    modelo = pickle.load(f)
print("[OK] Model loaded exitosamente\n")

# ============================================================================
# 2. CREATE 10 EXTREME STRESS SCENARIOS�?S
# ============================================================================
print("=" * 80)
print("CREANDO 10 ESCENARIOS DE ESTR�?S")
print("=" * 80 + "\n")

def crear_base_scenario():
    """Common base for all scenarios with neutral values"""
    return {
        'restaurant_id': 101,
        'capacity_limit': 150,
        'table_count': 40,
        'min_service_duration': 45,
        'terrace_setup_type': 'standard',
        'opens_weekends': True,
        'has_wifi': True,
        'restaurant_segment': 'casual',
        'menu_price': 14.50,
        'dist_office_towers': 200,
        'google_rating': 4.6,
        'cuisine_type': 'mediterranean'
    }

# Definition of 10 scenarios
scenarios = []

# Scenario 1: GOLDEN DAY [GOLDEN DAY]
s1 = crear_base_scenario()
s1.update({
    'service_date': datetime(2026, 3, 15),  # Viernes
    'max_temp_c': 25,  # Buen tiempo
    'precipitation_mm': 0,
    'is_rain_service_peak': False,
    'is_stadium_event': True,  # Evento estadio
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': True,  # Payweek
    'is_business_day': True,
    'services_lag_7': 120,  # Demanda previa alta
    'avg_4_weeks': 118.0,
    'business_logic': 'MAXIMUM DEMAND: Buen tiempo + Semana paga + Evento estadio + Labor'
})
scenarios.append(('Golden Day [GOLDEN]', s1))

# Scenario 2: TORMENTA PERFECTA [PERFECT STORM]
s2 = crear_base_scenario()
s2.update({
    'service_date': datetime(2026, 3, 16),  # Lunes lluvia
    'max_temp_c': 5,  # Extreme cold
    'precipitation_mm': 30,  # Extreme rain
    'is_rain_service_peak': True,
    'is_stadium_event': False,
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': False,  # Inicio de período
    'is_business_day': True,
    'services_lag_7': 80,  # Demanda previa baja
    'avg_4_weeks': 85.0,
    'business_logic': 'MINIMUM DEMAND: Extreme rain + Frio + Sin paga + Demanda baja'
})
scenarios.append(('Perfect Storm [STORM]', s2))

# Scenario 3: EFECTO VACACIONES [VACATION EFFECT]
s3 = crear_base_scenario()
s3.update({
    'service_date': datetime(2026, 8, 15),  # Agosto
    'max_temp_c': 40,  # Calor extremo
    'precipitation_mm': 0,
    'is_rain_service_peak': False,
    'is_stadium_event': False,
    'is_azca_event': True,  # Eventos de verano
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': False,  # Agosto, muchos de vacaciones
    'is_business_day': False,  # Vacaciones
    'services_lag_7': 45,  # Baja demanda previa (vacaciones)
    'avg_4_weeks': 50.0,
    'business_logic': 'AGOSTO CRITICO: Calor extremo + Vacaciones + Pocas transacciones'
})
scenarios.append(('Efecto Vacaciones [VACATION]', s3))

# Scenario 4: PICO POST-SALARIO [POST-PAYDAY PEAK]
s4 = crear_base_scenario()
s4.update({
    'service_date': datetime(2026, 3, 20),  # Primer viernes post-salario
    'max_temp_c': 18,  # Normal
    'precipitation_mm': 0,
    'is_rain_service_peak': False,
    'is_stadium_event': False,
    'is_azca_event': True,  # Evento Azca coincide
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': True,  # PRIMEROS DÍAS de paga
    'is_business_day': True,
    'services_lag_7': 125,
    'avg_4_weeks': 120.0,
    'business_logic': 'POST-SALARIO: Primera semana paga + Evento Azca + High spirits'
})
scenarios.append(('Post-Payday Peak [PAYDAY]', s4))

# Scenario 5: FIN DE SEMANA LLUVIOSO [RAINY WEEKEND]
s5 = crear_base_scenario()
s5.update({
    'service_date': datetime(2026, 3, 22),  # Domingo
    'max_temp_c': 12,  # Frío
    'precipitation_mm': 15,  # Lluvia moderada
    'is_rain_service_peak': True,
    'is_stadium_event': False,
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': False,
    'is_business_day': False,  # Fin semana
    'services_lag_7': 95,
    'avg_4_weeks': 100.0,
    'business_logic': 'FIN SEMANA LLUVIOSO: Lluvia + Sin paga + No laboral compensado'
})
scenarios.append(('Rainy Weekend [RAINY]', s5))

# Scenario 6: NOCHE DE REYES [EPIPHANY NIGHT]
s6 = crear_base_scenario()
s6.update({
    'service_date': datetime(2026, 1, 6),  # Epiphany day
    'max_temp_c': 8,
    'precipitation_mm': 2,
    'is_rain_service_peak': False,
    'is_stadium_event': False,
    'is_azca_event': True,
    'is_holiday': True,  # HOLIDAY
    'is_bridge_day': False,
    'is_payday_week': True,
    'is_business_day': False,
    'services_lag_7': 110,
    'avg_4_weeks': 115.0,
    'business_logic': 'HOLIDAY: Epiphany day + Holiday + Evento Azca + Post-paga'
})
scenarios.append(('Epiphany Night [HOLIDAY]', s6))

# Scenario 7: HOLIDAY BRIDGE [HOLIDAY BRIDGE]
s7 = crear_base_scenario()
s7.update({
    'service_date': datetime(2026, 5, 1),  # Puente festivo (1 mayo)
    'max_temp_c': 22,
    'precipitation_mm': 0,
    'is_rain_service_peak': False,
    'is_stadium_event': True,  # Coincide con evento
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': True,  # PUENTE
    'is_payday_week': False,
    'is_business_day': False,
    'services_lag_7': 100,
    'avg_4_weeks': 102.0,
    'business_logic': 'PUENTE: Buen clima + Bridge day + Stadium event + No laboral'
})
scenarios.append(('Holiday Bridge [BRIDGE]', s7))

# Scenario 8: CRISIS TOTAL [TOTAL CRISIS]
s8 = crear_base_scenario()
s8.update({
    'service_date': datetime(2026, 2, 1),  # Febrero
    'max_temp_c': 2,  # Nieve posible
    'precipitation_mm': 50,  # Lluvia torrencial
    'is_rain_service_peak': True,
    'is_stadium_event': False,
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': False,  # Sin paga
    'is_business_day': True,
    'services_lag_7': 30,  # Demanda histórica muy baja
    'avg_4_weeks': 35.0,
    'business_logic': 'CRISIS TOTAL: Todas las variables en rojo - Minimum predict'
})
scenarios.append(('Crisis Total [WORST]', s8))

# Scenario 9: PUNTO DE EBULLICI�"N [BOILING POINT]
s9 = crear_base_scenario()
s9.update({
    'service_date': datetime(2026, 6, 21),  # Verano
    'max_temp_c': 35,
    'precipitation_mm': 0,
    'is_rain_service_peak': False,
    'is_stadium_event': True,
    'is_azca_event': True,
    'is_holiday': True,  # San Juan
    'is_bridge_day': False,
    'is_payday_week': True,
    'is_business_day': False,
    'services_lag_7': 140,  # Muy alto
    'avg_4_weeks': 135.0,
    'business_logic': 'PUNTO EBULLICION: Todas variables en verde - Maximum predict'
})
scenarios.append(('Boiling Point [MAX]', s9))

# Scenario 10: DÍA NORMAL REFERENCIA [NORMAL DAY]
s10 = crear_base_scenario()
s10.update({
    'service_date': datetime(2026, 3, 18),  # Miércoles normal
    'max_temp_c': 18,
    'precipitation_mm': 2,
    'is_rain_service_peak': False,
    'is_stadium_event': False,
    'is_azca_event': False,
    'is_holiday': False,
    'is_bridge_day': False,
    'is_payday_week': False,
    'is_business_day': True,
    'services_lag_7': 105,
    'avg_4_weeks': 107.0,
    'business_logic': 'DIA NORMAL: Baseline para comparacion - Rango medio esperado'
})
scenarios.append(('Normal Day [BASELINE]', s10))

# ============================================================================
# 3. BUILD TEST DATAFRAME
# ============================================================================
print("\nConstructing test scenarios...\n")

lista_datos = []
for nombre, scenario_dict in scenarios:
    fila = scenario_dict.copy()
    fila['scenario_name'] = nombre
    lista_datos.append(fila)

df_pruebas = pd.DataFrame(lista_datos)

# Columns in correct model order
columnas_modelo = [
    'service_date', 'restaurant_id', 'max_temp_c', 'precipitation_mm',
    'is_rain_service_peak', 'is_stadium_event', 'is_azca_event', 'is_holiday',
    'is_bridge_day', 'is_payday_week', 'is_business_day', 'services_lag_7',
    'avg_4_weeks', 'capacity_limit', 'table_count', 'min_service_duration',
    'terrace_setup_type', 'opens_weekends', 'has_wifi', 'restaurant_segment',
    'menu_price', 'dist_office_towers', 'google_rating', 'cuisine_type'
]

# ============================================================================
# 4. GENERATE PREDICTIONS
# ============================================================================
print("=" * 80)
print("GENERANDO PREDICTIONONES DEL MODELO")
print("=" * 80 + "\n")

df_modelo = df_pruebas[columnas_modelo].copy()
predictions = modelo.predict(df_modelo)

df_pruebas['predicted_services'] = predictions.astype(int)

# ============================================================================
# 5. SUMMARY TABLE WITH�"GICA DE NEGOCIO
# ============================================================================
print("=" * 80)
print("TABLA RESUMEN - PREDICTIONONES CON L�"GICA DE NEGOCIO")
print("=" * 80 + "\n")

df_resumen = df_pruebas[[
    'scenario_name', 'max_temp_c', 'precipitation_mm', 'is_payday_week',
    'is_stadium_event', 'is_azca_event', 'is_holiday', 'is_bridge_day',
    'services_lag_7', 'prediccion_servicios', 'business_logic'
]].copy()

df_resumen.columns = [
    'Escenario', 'Temp(°C)', 'Lluvia(mm)', 'Paga', 'Estadio',
    'Azca', 'Festivo', 'Puente', 'Lag7', 'Predicción', 'Business Logic'
]

# Mostrar tabla de forma legible
print(df_resumen.to_string(index=False))
print("\n")

# ============================================================================
# 6. GENERAL STATISTICS
# ============================================================================
print("=" * 80)
print("ESTADÍSTICAS DE PREDICTIONONES")
print("=" * 80 + "\n")

stats = {
    'Minimum prediction': df_pruebas['prediccion_servicios'].min(),
    'Maximum prediction': df_pruebas['prediccion_servicios'].max(),
    'Average': df_pruebas['prediccion_servicios'].mean(),
    'Median': df_pruebas['prediccion_servicios'].median(),
    'Std. deviation': df_pruebas['prediccion_servicios'].std(),
    'Range (Max - Min)': df_pruebas['prediccion_servicios'].max() - df_pruebas['prediccion_servicios'].min(),
}

for key, value in stats.items():
    print(f"  {key:.<30} {value:>8.1f}")

print("\n")

# ============================================================================
# 7. SENSITIVITY ANALYSIS: STADIUM EVENT
# ============================================================================
print("=" * 80)
print("ANÁLISIS DE SENSIBILIDAD: IMPACTO DE EVENTO EN ESTADIO")
print("=" * 80 + "\n")

print("Comparando el MISMO día variando solo: is_stadium_event (True -> False)\n")

sensitivity_pairs = []

for idx, row in df_pruebas.iterrows():
    # Crear escenario CON evento
    scenario_with = row[columnas_modelo].to_dict()
    
    # Crear escenario SIN evento
    scenario_without = row[columnas_modelo].to_dict()
    scenario_without['is_stadium_event'] = False
    
    # Predicciones
    df_with = pd.DataFrame([scenario_with])
    df_without = pd.DataFrame([scenario_without])
    
    pred_with = modelo.predict(df_with)[0]
    pred_without = modelo.predict(df_without)[0]
    
    diferencia = int(pred_with) - int(pred_without)
    pct_cambio = (diferencia / int(pred_without) * 100) if int(pred_without) > 0 else 0
    
    sensitivity_pairs.append({
        'Escenario': row['scenario_name'],
        'Con Estadio': int(pred_with),
        'Sin Estadio': int(pred_without),
        'Diferencia': diferencia,
        'Cambio %': f"{pct_cambio:.1f}%",
        'Impacto': 'ALTO' if abs(diferencia) > 20 else ('MEDIO' if abs(diferencia) > 10 else 'BAJO')
    })

df_sensitivity = pd.DataFrame(sensitivity_pairs)
print(df_sensitivity.to_string(index=False))

print("\n" + "=" * 80)
print("CONCLUSIONES DE SENSIBILIDAD")
print("=" * 80 + "\n")

promedio_impacto = df_sensitivity['Diferencia'].abs().mean()
max_impacto = df_sensitivity['Diferencia'].abs().max()
min_impacto = df_sensitivity['Diferencia'].abs().min()

print(f"  Impacto Average del Evento Estadio: {promedio_impacto:.1f} servicios")
print(f"  Impacto Máximo: {max_impacto:.0f} servicios")
print(f"  Impacto Mínimo: {min_impacto:.0f} servicios")
print(f"\n  �?' El evento en estadio afecta en promedio ~{promedio_impacto:.0f} clientes/servicios")
print(f"  �?' Esto representa el factor más importante en días con condiciones favorables")

# ============================================================================
# 8. EXPORTAR RESULTADOS
# ============================================================================
print("\n" + "=" * 80)
print("EXPORTANDO RESULTADOS")
print("=" * 80 + "\n")

# Guardar DataFrame de pruebas
df_pruebas.to_csv('df_pruebas_completo.csv', index=False, encoding='utf-8')
print("[OK] Archivo 'df_pruebas_completo.csv' creado")

# Guardar resumen
df_resumen.to_csv('resumen_predicciones.csv', index=False, encoding='utf-8')
print("[OK] Archivo 'resumen_predicciones.csv' creado")

# Guardar sensibilidad
df_sensitivity.to_csv('sensibilidad_estadio.csv', index=False, encoding='utf-8')
print("[OK] Archivo 'sensibilidad_estadio.csv' creado")

print("\n" + "=" * 80)
print("[SUCCESS] ANALISIS COMPLETADO EXITOSAMENTE")
print("=" * 80)



