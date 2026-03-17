# AZCA IA Responsable - Estándar Integral

## 1. Principios Fundamentales

AZCA se compromete con:

### ✅ Transparencia Total
- **Qué datos usamos**: Documentado en cada predicción
- **Cómo funcionan los modelos**: Model Cards públicos
- **Limitaciones**: Siempre mencionadas explícitamente
- **Incertidumbre**: Indicada con niveles de confianza

### ✅ Privacidad Extrema
- NO se usan datos personales de clientes finales
- Solo agregados anónimos (ej: "cuántos servicios" no "quién")
- NO compartimos datos con terceros
- Cumplimiento GDPR/RGPD

### ✅ Honestidad sobre Capacidades
- "Los modelos son predictores, no oráculos"
- Casos de fallo documentados explícitamente
- Menciones explícitas de "alucinaciones de IA"
- Sin overhyping de capacidades

### ✅ Equidad
- Tests periódicos contra sesgos
- Validación en restaurantes de diferentes tamaños
- Auditoría en diferentes geografías
- Métrica: disparidad <5% entre grupos

---

## 2. Componentes Implementados

### 2.1 AITransparencyCard (Componente)
**Propósito**: Mostrar transparencia del modelo en forma de tarjeta

**Props**:
```typescript
title: string                          // "Predicción de Servicios"
dataUsed: string[]                     // ["Historial 28 días", ...]
limitations: string[]                  // ["No predice cambios", ...]
confidenceLevel: 'low' | 'medium' | 'high'
lastUpdated?: string                   // Fecha de actualización
```

**Ubicación**: `frontend/src/components/ai/AITransparencyCard.tsx`

**Uso**:
```tsx
<AITransparencyCard
  title="Predicción de Demanda"
  dataUsed={['Historial 28 días', 'Clima', 'Calendario']}
  limitations={['No predice eventos', 'Requiere 2 sem. datos']}
  confidenceLevel="medium"
/>
```

### 2.2 AIDisclaimer (Componente)
**Propósito**: Pequeña alerta/información sobre limitaciones de IA

**Props**:
```typescript
type: 'warning' | 'info' | 'error'     // Tipo de mensaje
title?: string                         // Titulo personalizado
message?: string                       // Mensaje personalizado
```

**Ubicación**: `frontend/src/components/ai/AIDisclaimer.tsx`

**Uso**:
```tsx
<AIDisclaimer
  type="warning"
  title="Limitación"
  message="Los platos nuevos tendrán predicciones pobres."
/>
```

### 2.3 ServicePredictionTransparency (Componente)
**Propósito**: Transparency específica para predicción de servicios

**Data Usada**:
- 📊 Historial 4 semanas
- 🏢 Capacidad/horarios/segmento
- 📅 Festividades/ciclos de pago
- 🌤️ Meteorología (Open-Meteo)
- ⭐ Ubicación/reputación

**Limitaciones**:
- No usa datos personales
- Menos preciso en eventos no planificados
- Necesita 2-3 semanas mínimo
- No incluye cambios de marketing

**Ubicación**: `frontend/src/components/ai/ServicePredictionTransparency.tsx`

### 2.4 MenuPredictionTransparency (Componente)
**Propósito**: Transparency específica para predicción de platos

**Data Usada**:
- 📋 Órdenes históricas (90 días)
- 🍽️ Tipo de cocina
- 👥 Segmento restaurante
- 📆 Estacionalidad/día semana
- 🌡️ Meteorología
- ⭐ Correlaciones (qué va con qué)

**Limitaciones**:
- ⚠️ "Alucinaciones" de IA posibles
- Platos nuevos: predicción pobre inicial
- Cambios de receta/nombre no detectados
- Necesita 1 mes mínimo histórico
- No considera cambios de costo/ingredientes

**Ubicación**: `frontend/src/components/ai/MenuPredictionTransparency.tsx`

### 2.5 PredictionWithDisclaimer (Componente Wrapper)
**Propósito**: Envuelve predicción con disclaimer + confianza

**Props**:
```typescript
title: string                          // Título de predicción
type: 'service' | 'menu'              // Tipo
confidenceLevel: 'low' | 'medium' | 'high'
showDisclaimer?: boolean               // Mostrar alerta
```

**Ubicación**: `frontend/src/components/ai/PredictionWithDisclaimer.tsx`

**Uso**:
```tsx
<PredictionWithDisclaimer
  title="Demanda Estimada"
  type="service"
  confidenceLevel="high"
>
  {/* Contenido de predicción */}
</PredictionWithDisclaimer>
```

### 2.6 AIModelCardsPage (Página)
**Propósito**: Documentación completa de modelos (estilo Google Model Cards)

**Contiene**:
- Explicación de modelos
- Data & features
- Limitaciones explícitas
- Cómo mejoramos
- Preguntas frecuentes
- Compromiso IA responsable

**Ubicación**: `frontend/src/pages/AIModelCardsPage.tsx`

**Ruta sugerida**: `/ai-model-cards` o `/about/ai-responsable`

---

## 3. Integración en Aplicación

### En PredictionDashboard.tsx

```tsx
import AITransparencyCard from '../../components/ai/AITransparencyCard'
import ServicePredictionTransparency from '../../components/ai/ServicePredictionTransparency'
import MenuPredictionTransparency from '../../components/ai/MenuPredictionTransparency'
import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'

export default function PredictionDashboard() {
  // ... predicciones

  return (
    <div className="space-y-8">
      {/* Disclaimer general */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          🤖 Estamos usando IA responsable. Todas las predicciones incluyen información 
          sobre datos, limitaciones y confianza.{' '}
          <a href="/ai-model-cards" className="font-semibold underline">
            Ver modelo completo
          </a>
        </p>
      </div>

      {/* Sección de Servicios */}
      <PredictionWithDisclaimer
        title="Predicción de Servicios"
        type="service"
        confidenceLevel={predictedServices.confidence}
      >
        <ServicePredictionTransparency />
        {/* Contenido de predicción */}
      </PredictionWithDisclaimer>

      {/* Sección de Menú */}
      <PredictionWithDisclaimer
        title="Predicción de Platos"
        type="menu"
        confidenceLevel={predictedMenu.confidence}
      >
        <MenuPredictionTransparency />
        {/* Contenido de predicción */}
      </PredictionWithDisclaimer>
    </div>
  )
}
```

---

## 4. Estándares de Documentación

### 4.1 Cada Predicción Debe Incluir:

```
┌─────────────────────────────────────┐
│ PREDICCIÓN: Servicios para 25/Feb   │
├─────────────────────────────────────┤
│ Confianza: 🟢 Alta (87%)            │
├─────────────────────────────────────┤
│ Predicción: 18 ± 3 servicios        │
├─────────────────────────────────────┤
│ Datos usados:                       │
│ • Historial 28 días                 │
│ • Clima: 25°C, 0% lluvia            │
│ • Capacidad: 20 servicios máx       │
├─────────────────────────────────────┤
│ ⚠️ Limitaciones:                     │
│ • No predice eventos virales        │
│ • Puede fallar sin histórico        │
│ • +/- 3 servicios error esperado    │
└─────────────────────────────────────┘
```

### 4.2 Convenciones Visuales

- 🟢 **Alta Confianza** (>80%): Verde
- 🟡 **Media Confianza** (60-80%): Naranja
- 🔴 **Baja Confianza** (<60%): Rojo

### 4.3 Información de Contexto

Cada predicción incluye:
- Metrics de precisión esperada
- Timestamp de última actualización
- Fecha de reentrenamiento
- Link a Model Cards para más info

---

## 5. Limitaciones Documentadas

### Predicción de Servicios

❌ **No puede predecir**:
- Cambios de marketing no planificados
- Cierres repentinos de competencia
- Eventos virales o trending topics
- Cambios de preferencia a largo plazo
- Pandemias o disrupciones mayores

⚠️ **Precisión degradada en**:
- Restaurantes <2 semanas operación
- Cambios de ubicación o nombre
- Remodelaciones o cambios de menú
- Predicciones >30 días futuro

### Predicción de Menú

❌ **No puede predecir**:
- Platos que no están en historial
- Cambios de tendencia viral
- Nuevas recetas o cambios de ingredientes
- Cierres de suplidores

⚠️ **Precisión degradada en**:
- Restaurantes <1 mes operación
- Cambios de precio o tamaño porción
- Restaurantes con <50 órdenes/semana

**🤖 Alucinaciones**: Puede a veces recomendar platos que:
- No están en tu menú actual
- Desaparecieron hace meses
- Tienen nombres similares pero no existen

---

## 6. Mejora Continua

### Reentrenamiento
- **Frecuencia**: Mensual
- **Datos**: Últimos 90 días
- **Métrica**: RMSE, MAE, precisión top-3

### Auditoría de Sesgo
- **Trimestral**: Check contra tamaño de restaurante
- **Trimestral**: Check contra ubicación geográfica
- **Semestral**: Check contra tipo de cocina
- **Objetivo**: Disparidad <5% entre grupos

### Feedback de Usuarios
- Opción de "Esta predicción fue mala"
- Agregación anónima
- Exclusión de restaurantes con muchos fallos
- Mejora de features basada en feedback

### A/B Testing
- Nuevas features se prueban en subconjunto
- Métrica de éxito: usuario lo usa / lo ignora
- Cambios solo si +5% adopción

---

## 7. Garantías & Caveats

### No Garantizamos
- ❌ Precisión 100% (imposible)
- ❌ Predicciones inmutables (se actualizan)
- ❌ Explicabilidad perfecta (Black box)
- ❌ Funcionamiento en todos contextos

### Sí Garantizamos
- ✅ Privacidad de datos (NO datos personales)
- ✅ Transparencia (Documentamos todo)
- ✅ Honestidad (Listamos limitaciones)
- ✅ Mejora continua (Reentrenamiento mensual)

### Responsabilidad
- El restaurador es responsable por decisiones basadas en IA
- AZCA no es responsable por pérdidas por mal uso
- Recomendamos verificar siempre con experiencia local
- Para casos de fallo crítico, reportar a soporte

---

## 8. Cumplimiento Regulatorio

### GDPR/RGPD
- ✅ No procesamos datos personales
- ✅ Derecho a explicación: Model Cards públicas
- ✅ Derecho a oposición: opt-out de predicciones
- ✅ Derecho a eliminar: historial anónimizado

### Ley de IA de la UE (EU AI Act)
- ✅ Transparencia: Documentada
- ✅ Monitoreo: Auditoría trimestral
- ✅ Documentación: Model Cards + este estándar
- ✅ High-risk mitigation: No impacto empleados/rechazos

### Normativa Local (España)
- ✅ Cumplimiento regulatorio: Procesos
- ✅ Auditoría SOC2: En progreso
- ✅ Certificación ISO 27001: Planificado

---

## 9. Contacto & Más Información

- 📧 `ia-responsable@azca.es` - Preguntas sobre IA
- 📄 `/ai-model-cards` - Model Cards públicas
- 🐛 Reportar sesgo/errores: formulario en dashboard
- 📞 Soporte: Sistema normal de tickets

---

**Versión**: 1.0
**Fecha**: Marzo 2026
**Siguiente revisión**: Junio 2026
