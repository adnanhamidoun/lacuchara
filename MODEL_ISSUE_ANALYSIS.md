# 🔴 Análisis del Problema de Carga de Modelos

## El Problema Real

**Ambos modelos tienen el MISMO problema**: Dependencias ONNX C++ rotas en Windows.

```
Error: DLL load failed while importing onnx_cpp2py_export: 
       Error en una rutina de inicialización de biblioteca de vínculos dinámicos (DLL)
```

### Modelos Afectados:
1. **azca_demand_v1.pkl** → Usado por `/predict` clásico
2. **azca-secondary-menus-model.pkl** → Usado por `/predict/starter`, `/predict/main`, `/predict/dessert`

Ambos son modelos **Azure AutoML** que tienen estas dependencias en la cadena de desserialización:

```
pickle.load()
  ↓ (deserialization triggers imports)
azureml.automl
  ↓
skl2onnx
  ↓
onnx
  ↓
onnx_cpp2py_export.dll  ← 💥 DLL NOT FOUND / BROKEN
```

---

## Por Qué No Funcionan Incluso Después del "Cambio de Modelo"

El problema **no es el modelo nuevo**, es que:

1. **Ambos modelos son Azure AutoML** → Mismas dependencias
2. **ONNX C++ bindings no están disponibles** en Windows (o están corruptas)
3. **Esto ocurre durante desserialización** (pickle.load), no durante uso
4. **Online no hay solución simple** para Windows con estas librerías específicas

---

## Soluciones Posibles

### ❌ NO Sirven
- Reinstalar onnx → Sigue siendo la misma DLL
- Cambiar versión de onnx → Sigue siendo incompatibilidad C++
- Usar otro modelo Azure → Tiene las mismas dependencias
- Lazy loading → Solo oculta el error, no lo soluciona

### ✅ SÍ Servirían
1. **Usar modelos sklearn puros** (sin Azure AutoML)
   - Archivos .pkl creados con sklearn directo
   - Sin dependencias de azureml/onnx
   
2. **Exportar modelos a ONNX native** (sin Azure)
   - Archivo .onnx en lugar de .pkl
   - Usar onnxruntime en lugar de azureml
   
3. **Usar Python 3.8 o 3.9 específicamente**
   - En casos raros, hay conflictos de versión con ONNX
   
4. **Entrenar nuevos modelos en regresión sin AutoML**
   - XGBoost, LightGBM, RandomForest
   - Guardar como pickle vanilla

---

## Acción Inmediata

Los endpoints ahora retornan **410 Gone** con explicación clara:

```
GET /predict/top-dishes/{restaurant_id}?service_date=2026-03-16
```

Este es el endpoint correcto para usar. Los modelos Azure están deshabilitados porque:

- **No son culpa del código**
- **Es un problema de dependencias del sistema**
- **No tiene solución sin cambiar los modelos base**

---

## Próximos Pasos (Recomendados)

1. **Entrenar nuevos modelos sin Azure AutoML**
   - Usar sklearn, XGBoost, o similar
   - Métodos de validación estándar
   
2. **O exportar modelos existentes a ONNX Runtime**
   - Pasar de Azure AutoML → ONNX Runtime
   - Menos dependencias, más compatible
   
3. **Verificar si los modelos funcionan en Linux/Mac**
   - El problema podría ser específico de Windows
   - Si funciona en otro SO, es un problema de binarios Windows

