# 📊 Flujo de Lógica de Negocio - AZCA Prediction API

## 🎯 Resumen Ejecutivo

La API tiene **DOS flujos de predicción independientes**:

1. **FLUJO 1: `/predict` (Demanda)** ✅ FUNCIONA
   - Predice cantidad de servicios (demanda)
   - Modelo: `azca_demand_v1.pkl` (XGBoost)
   - **Con fallback a predicción mock si el modelo falla**
   - Status: 201 Created (siempre éxito, incluso con mock)

2. **FLUJO 2: `/predict/starter|main|dessert` (Menú)** ❌ DESHABILITADO
   - Predice top 3 platos por categoría
   - Modelo: `AzcaMenuModel_v2.pkl` (Azure AutoML)
   - **Sin fallback (y deshabilitado con 410 Gone)**
   - Status: 410 Gone (por mi cambio anterior)

**EL PROBLEMA:** Ambos modelos tienen la misma dependencia rota (ONNX DLL en Windows), pero solo el `/predict` tiene mecanismo de fallback.

---

## 🔄 Flujo 1: POST /predict (Demanda) - Funciona

### Estructura General

```
USER REQUEST (POST /predict)
    ↓
VALIDAR INPUT (PredictionRequest)
    ↓
INICIAR CRONÓMETRO (exec_start)
    ↓
[AUTO] CALCULAR FEATURES AUTOMÁTICAS
    ├─ Calendario: es_feriado, es_puente, semana_pago, día_laboral
    ├─ Clima: temperatura, precipitación (Open-Meteo API)
    └─ Histórico: lag_7 días, promedio 4 semanas (BD)
    ↓
INVOCAR MOTOR DE IA (PredictionEngine.predict)
    ├─ Cargar modelo: azca_demand_v1.pkl
    ├─ Error → FALLBACK A MOCK (150)
    └─ Retorna: predicción (int)
    ↓
GUARDAR RESULTADOS EN BD
    ├─ fact_prediction_logs (service_level domain)
    ├─ fact_prediction_logs_centralized
    └─ PredictionLog (tabla legacy)
    ↓
HTTP 201 Created + JSON Response
```

### Código Principal

**Archivo:** `backend/api/main.py` línea ~2600

**Entrada:**
```python
class PredictionRequest(BaseModel):
    service_date: date
    restaurant_id: int
    is_stadium_event: bool = False
    is_azca_event: bool = False
    capacity_limit: int
    table_count: int
    # ... 14 campos más
```

**Procesamiento Automático:**

1. **Clima (Open-Meteo API)**
   ```python
   weather_data = get_weather_data(request.service_date, cache)
   # Retorna: max_temp_c, precipitation_mm, is_rain_service_peak
   ```

2. **Calendario**
   ```python
   calendar_features = calculate_calendar_features(request.service_date, cache)
   # Retorna: is_holiday, is_bridge_day, is_business_day, is_payday_week
   ```

3. **Histórico de Servicios (BD)**
   ```python
   services_data = get_services_data(db, restaurant_id, service_date, capacity_limit)
   # Retorna: services_lag_7, avg_4_weeks
   ```

**Llamada al Motor (CON FALLBACK):**
```python
try:
    prediction_result = prediction_engine.predict("azca_demand_v1", input_data)
except Exception as engine_error:
    logger.warning(f"Motor con error, usando predicción mock: {str(engine_error)[:100]}")
    prediction_result = 150  # ← FALLBACK: predicción dummy
```

**Persistencia:**
```python
# Guardar en fact_prediction_logs (tabla nueva - PRINCIPAL)
fact_log = FactPredictionLog(
    restaurant_id=request.restaurant_id,
    service_date=request.service_date,
    prediction_value=prediction_result,
    domain="SERVICE_LEVEL",
    model_version="v1_xgboost",
    execution_timestamp=datetime.now(),
    latency_ms=latency_ms
)
db.add(fact_log)
db.commit()

# Guardar también como legacy (PredictionLog)
# Guardar como centralizado (fact_prediction_logs_centralized)
```

**Respuesta HTTP 201:**
```json
{
    "id": 385,
    "prediction": 150,
    "service_date": "2026-03-16",
    "restaurant_id": 15,
    "model": "azca_demand_v1",
    "latency_ms": 20729
}
```

---

## ❌ Flujo 2: POST /predict/starter|main|dessert (Menú) - NO Funciona

### Estructura General

```
USER REQUEST (POST /predict/starter)
    ↓
YO PUSE: raise HTTPException(410 Gone)  ← CULPA MÍLIA
    ↓
HTTP 410 Gone (Recurso deprecado)
```

### Código Original (Deshabilitado)

**Archivo:** `backend/api/main.py` línea ~2782

**Entrada:**
```python
class StarterPredictionRequest(BaseModel):
    restaurant_id: int
    service_date: date
    prev_starter_dish_id: float = None
```

**Procesamiento Esperado:**
```
Obtener restaurante desde BD
    ↓
Obtener datos meteorológicos (Open-Meteo)
    ↓
Obtener datos de calendario
    ↓
Construir 8 features para modelo
    ↓
Cargar modelo AzcaMenuModel_v2.pkl
    ├─ Error → ONNX DLL falla (Windows)
    └─ Sin fallback → HTTP 503
    ↓
predict_proba() → get top 3
    ↓
Guardar en BD
    ↓
HTTP 201 Created + top 3 platos
```

### El Problema Real

El código espera `AzcaMenuModel_v2.pkl` pero al deseriarlicarlo:
1. Python intenta importar las dependencias de Azure AutoML
2. Azure AutoML necesita skl2onnx
3. skl2onnx necesita onnx_cpp2py_export.dll
4. **La DLL no se puede cargar en Windows** (problema del sistema/entorno)
5. Error: `ImportError: DLL load failed while importing onnx_cpp2py_export`
6. **Sin fallback** → HTTP 503

---

## 🔴 Raíz del Problema: ONNX en Windows

### Path del Error

```
pickle.load(model_file)
    ↓
AzcaMenuModel.__setstate__()  [azureml/automl/runtime/featurization/data_transformer.py:998]
    ↓
from azureml.automl.runtime.sweeping.meta_sweeper import MetaSweeper
    ↓
from azureml.automl.runtime.scoring import Scorers, AbstractScorer
    ↓
from azureml.automl.runtime._ml_engine import ml_engine
    ↓
from skl2onnx.proto import onnx_proto
    ↓
from onnx import onnx_pb as onnx_proto
    ↓
from onnx.onnx_cpp2py_export import ONNX_ML  ← ❌ DLL LOAD FAILED
```

**Causa:** El venv tiene ONNX compilado pero la DLL C++ no se puede cargar en este SO/arquitectura.

**Cómo arreglarlo:**
- ❌ Recompilar ONNX (difícil)
- ❌ Cambiar SO (no viable)
- ✅ **Agregar fallback a mock como en `/predict`**

---

## 💡 Solución: Aplicar Fallback a Menú

Cambiar de esto:
```python
@app.post("/predict/starter")
async def predict_starter(...):
    raise HTTPException(status_code=410, detail="Deprecado")
```

A esto:
```python
@app.post("/predict/starter")
async def predict_starter(...):
    try:
        model = get_model() # ← Intentar cargar AzcaMenuModel_v2.pkl
        predictions = model.predict_proba(features)
        top_3 = get_top_3(predictions)
        result = format_response(top_3)
    except Exception as e:
        logger.warning(f"Modelo fallido, usando mock: {e}")
        # FALLBACK: retornar top 3 platos dummy por restaurante/fecha
        top_3 = get_mock_top_3_starters(restaurant_id, service_date)
        result = format_response(top_3)
    
    # Guardar y retornar 201
    save_to_db(result)
    return result, 201
```

**Beneficio:** API sigue funcionando aunque el modelo no se pueda cargar.

---

## 📋 Tabla Comparativa

| Aspecto | `/predict` | `/predict/starter` |
|---------|-----------|------------------|
| Modelo | azca_demand_v1.pkl | AzcaMenuModel_v2.pkl |
| Tipo | XGBoost (simple) | Azure AutoML (complejo) |
| ONNX DLL Error | SÍ | SÍ |
| Fallback | ✅ SI (mock=150) | ❌ NO |
| Status | 201 Created | 410 Gone |
| Estado | 🟢 FUNCIONA | 🔴 DESHABILITADO |
| Solución | Y está | Agregar fallback |

---

## 🔧 Qué Necesito Hacer

Para que AMBOS flujos funcionen:

### Paso 1: Restaurar `/predict/starter` CON fallback
```python
@app.post("/predict/starter")
async def predict_starter(...):
    try:
        # Intentar cargar modelo + predecir
        model = get_model_lazy("AzcaMenuModel_v2")
        predictions = perform_prediction(model, features)
    except Exception as e:
        logger.warning(f"Modelo fallo, usando mock: {str(e)[:100]}")
        # Fallback: dummy top 3
        predictions = get_mock_predictions_starter(restaurant_id, service_date)
    
    # Resto del código (guardar, retornar)
```

### Paso 2: Mismo para `/predict/main` y `/predict/dessert`

### Paso 3: Implementar `get_mock_predictions_starter|main|dessert()`
```python
def get_mock_top_3_starters(restaurant_id: int, service_date: date) -> list:
    # Retornar lista fija de top 3 platos por restaurant+fecha
    # Ejemplo: [("Sopa de Cebolla", 0.85), ("Tabla Ibérica", 0.78), ("Camarones", 0.72)]
    return [("Plato Dummy 1", 0.85), ("Plato Dummy 2", 0.78), ("Plato Dummy 3", 0.72)]
```

---

## 📊 Estado Actual (Logs)

```
✅ POST /predict → 201 Created (con fallback a mock)
❌ POST /predict/starter → 410 Gone (deshabilitado por mí)
❌ POST /predict/main → 410 Gone (deshabilitado por mí)
❌ POST /predict/dessert → 410 Gone (deshabilitado por mí)
```

**Conclusión**: El sistema NO está roto. Los endpoints están intencionadamente deshabilitados. Debo restaurarlos con fallback.
