# 📊 Inventario Completo - Sistema IA Responsable AZCA

## Componentes React (11 componentes)

| # | Componente | Ubicación | Props | Propósito | Variantes |
|---|------------|-----------|-------|---------|-----------|
| 1 | **AITransparencyCard** | `components/ai/` | title, dataUsed[], limitations[], confidenceLevel, lastUpdated | Tarjeta reutilizable mostrando datos + limitaciones | Confianza: low/medium/high |
| 2 | **AIDisclaimer** | `components/ai/` | type, title?, message? | Alerta de disclaimer | warning/info/error |
| 3 | **ServicePredictionTransparency** | `components/ai/` | (sin props) | Transparency específica servicios | Fixed content |
| 4 | **MenuPredictionTransparency** | `components/ai/` | (sin props) | Transparency específica platos | Fixed content |
| 5 | **PredictionWithDisclaimer** | `components/ai/` | title, children, type, showDisclaimer?, confidenceLevel? | Wrapper con disclaimer + confianza | service/menu |
| 6 | **AIFailureWarning** | `components/ai/` | scenarios[], title? | Muestra casos de fallo con probabilidad | high/medium/low |
| 7 | **PredictionConfidenceBreakdown** | `components/ai/` | overallConfidence, factors[], explanation? | Desglose visual de factores | Barras por factor |
| 8 | **AIResponsibleHealthCheck** | `components/ai/` | showDetails? | Dashboard de salud del sistema | SUMMARY/DETAILED |
| 9 | **AIResponsibleBadge** | `components/ai/` | size?, variant?, tooltip?, onClick? | Badge para indicar IA responsable | icon/text/full |
| 10 | **AIFeedbackButton** | `components/ai/` | predictionId?, type?, onlyIcon? | Botón estético para feedback (no funcional) | service/menu, icon/full |
| 11 | **AISupervisionSection** | `components/ai/` | showDetails? | Explica control humano sobre IA | DETAILED/SIMPLE |

---

## Páginas (2 páginas)

| # | Página | Ubicación | Ruta | Contenido | Público |
|---|--------|-----------|------|----------|---------|
| 1 | **AIModelCardsPage** | `pages/` | `/ai-model-cards` | Documentación completa (Google Model Cards style) | ✅ Público |
| 2 | **IAResponsableExamplePage** | `pages/` | `/ai-responsable-example` | Ejemplo práctico con ambos modelos | ✅ Público |

### Contenido de AIModelCardsPage
```
- Header: "Estándares de IA Responsable"
- Disclaimer principal (Compromiso con IA)
- Sección 1: Predicción de Servicios
  └─ AITransparencyCard + explicación
- Sección 2: Predicción de Platos  
  └─ AITransparencyCard + explicación
- Sección 3: Cómo mejoramos
  └─ Reentrenamiento, pruebas sesgo, feedback, privacidad
- Sección 4: FAQs (5 preguntas expandibles)
- Footer: Versión, fecha, próxima revisión
```

### Contenido de IAResponsableExamplePage
```
- Header + descripción
- Ejemplo 1: Predicción de Servicios
  • Disclaimer
  • PredictionWithDisclaimer wrapper
    • Predicción (18 ± 3 servicios)
    • PredictionConfidenceBreakdown (87%)
    • ServicePredictionTransparency
    • AIFailureWarning (4 escenarios)
  
- Ejemplo 2: Predicción de Platos
  • Disclaimer (warning)
  • PredictionWithDisclaimer wrapper
    • Top 5 recomendaciones
    • PredictionConfidenceBreakdown (74%)
    • MenuPredictionTransparency
    • AIFailureWarning (4 escenarios)

- Sección: Mejores prácticas (8 items: HAGO/NO HAGO)
- Conclusión
```

---

## Documentación (4 documentos)

| # | Documento | Ubicación | Para Quién | Contenido |
|---|-----------|-----------|-----------|----------|
| 1 | **AI_RESPONSIBLE_STANDARD** | `docs/` | Internos/Reguladores | 9 secciones: principios, componentes, limitaciones, reglamento |
| 2 | **IA_RESPONSABLE_INTEGRATION** | `docs/guides/` | Developers | 7 pasos exactos integración en app existente |
| 3 | **IA_RESPONSABLE_RESUMEN_FINAL** | `docs/guides/` | Todos | Resumen ejecutivo, índice, roadmap, contacto |
| 4 | **IA_RESPONSABLE_CHECKLIST** | `docs/guides/` | QA/Developers | 12 fases de testing + troubleshooting |

---

## Características Técnicas

### 📐 Componentes: Propiedades Comunes

**Styling**:
- Framework: Tailwind CSS
- CSS Variables: `--bg`, `--surface`, `--text`, `--text-muted`, `--border`
- Dark Mode: Soportado (usa `var(--*)`)

**Props Típicas**:
```typescript
// Confianza
confidenceLevel: 'low' | 'medium' | 'high'
overallConfidence: number (0-100)

// Tipo de prediction
type: 'service' | 'menu'

// Factores de confianza
factors: Array<{name, score, description, impact}>

// Escenarios
scenarios: Array<{scenario, probability, example, whatToDo}>
```

**Colores**:
- ✅ Alta: `#4CAF50` (Verde)
- ⚠️ Media: `#FFB84D` (Naranja)
- ❌ Baja: `#FF6B6B` (Rojo)

---

## Datos Incluidos en Componentes

### ServicePredictionTransparency: Datos Usados
1. 📊 Historial 4 semanas
2. 🏢 Capacidad/horarios/segmento
3. 📅 Festividades/ciclos pago
4. 🌤️ Meteorología (Open-Meteo)
5. ⭐ Ubicación/reputación

### ServicePredictionTransparency: Limitaciones
1. No datos personales
2. Menos preciso en eventos no planificados
3. Necesita 2-3 semanas mínimo
4. No incluye marketing
5. Precisión cae >30 días futuro

### MenuPredictionTransparency: Datos Usados
1. 📋 Órdenes históricas (90 días)
2. 🍽️ Tipo cocina
3. 👥 Segmento restaurante
4. 📆 Estacionalidad
5. 🌡️ Meteorología
6. ⭐ Correlaciones

### MenuPredictionTransparency: Limitaciones
1. Alucinaciones posibles ⚠️
2. Platos nuevos: pobre inicial
3. Cambios receta/nombre no detectados
4. Necesita 1 mes mínimo
5. No considera cambios costo
6. No predice cambios viral

---

## Rutas & Links

```
Frontend Routes:
├── /ai-model-cards
│   └── AIModelCardsPage
│       └── Links internos:
│           ├── /ai-responsable-example
│           └── mailto:ia-responsable@azca.es
│
└── /ai-responsable-example
    └── IAResponsableExamplePage
        └── Links internos:
            ├── /ai-model-cards
            └── mailto:ia-responsable@azca.es
```

---

## Emails & Contacto

```
📧 ia-responsable@azca.es
   - Preguntas sobre IA
   - Reportar sesgo/errores
   - Auditoria/compliance
```

---

## Integración Recomendada en Existing App

```typescript
// En tu PredictionDashboard.tsx

import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'
import ServicePredictionTransparency from '../../components/ai/ServicePredictionTransparency'
import MenuPredictionTransparency from '../../components/ai/MenuPredictionTransparency'
import AIResponsibleBadge from '../../components/ai/AIResponsibleBadge'

export default function PredictionDashboard() {
  return (
    <div>
      {/* Seción Servicios */}
      <PredictionWithDisclaimer type="service" confidenceLevel="high">
        <ServicePredictions />
        <ServicePredictionTransparency />
      </PredictionWithDisclaimer>

      {/* Sección Platos */}
      <PredictionWithDisclaimer type="menu" confidenceLevel="medium">
        <MenuPredictions />
        <MenuPredictionTransparency />
      </PredictionWithDisclaimer>

      {/* Badge opcional en sidebar */}
      <AIResponsibleBadge 
        variant="text" 
        onClick={() => navigate('/ai-model-cards')}
      />
    </div>
  )
}
```

---

## Testing Checklist por Componente

### ✅ AITransparencyCard
- [ ] Muestra título
- [ ] Lista datos usados con emojis
- [ ] Lista limitaciones
- [ ] Muestra barra de confianza con color correcto
- [ ] Responsive:
  - [ ] Mobile (390px): Items apilados
  - [ ] Tablet (768px): OK
  - [ ] Desktop (1920px): Max-width respetado

### ✅ AIDisclaimer
- [ ] Tipo "warning" → Naranja ⚠️
- [ ] Tipo "info" → Azul ℹ️
- [ ] Tipo "error" → Rojo ❌
- [ ] Título y mensaje claros
- [ ] Responsive en móvil

### ✅ ServicePredictionTransparency
- [ ] Carga sin error
- [ ] 5 datos listados
- [ ] 5 limitaciones listadas
- [ ] Icono 🤖 visible
- [ ] Confianza medium/high visible

### ✅ MenuPredictionTransparency
- [ ] Carga sin error
- [ ] 6 datos listados
- [ ] 6 limitaciones listadas
- [ ] Menciona "alucinaciones de IA" explícitamente
- [ ] Icono 🤖 visible

### ✅ PredictionWithDisclaimer
- [ ] Muestra título predicción
- [ ] Barra confianza visible
- [ ] Disclaimer aparece automáticamente
- [ ] Meta información al pie
- [ ] Contenido hijo renderiza correctamente

### ✅ AIFailureWarning
- [ ] 4 escenarios visible
- [ ] Probabilidades coloreadas (alto/medio/bajo)
- [ ] Ejemplos claros
- [ ] "Qué hacer" es actionable
- [ ] Responsive

### ✅ PredictionConfidenceBreakdown
- [ ] Muestra % general (87%, 74%, etc.)
- [ ] Barra progreso anima
- [ ] Factores listados (3+)
- [ ] Cada factor tiene barra individual
- [ ] Colores por factor score correcto

### ✅ AIResponsibleHealthCheck
- [ ] Status counts visible (4 OK, 2 warning, 0 error)
- [ ] Detalles expandibles
- [ ] Cada check muestra status icon
- [ ] Footer con info útil

### ✅ AIResponsibleBadge
- [ ] Variant "icon": solo 🤖
- [ ] Variant "text": 🤖 + palabra
- [ ] Variant "full": card completa
- [ ] Tamaños small/medium/large funcionan
- [ ] Click trigger handler si provided

### ✅ AIModelCardsPage
- [ ] Carga sin error
- [ ] 4 secciones principales visible
- [ ] FAQs expandibles/colapsibles
- [ ] Links funcionan (/ ai-responsable-example, mailto:)
- [ ] Responsive en móvil

### ✅ IAResponsableExamplePage
- [ ] Carga sin error
- [ ] 2 ejemplos visible y completos
- [ ] Dentro de cada ejemplo:
  - [ ] Disclaimer visible
  - [ ] Wrapper carga
  - [ ] Predicción visible
  - [ ] Confidence breakdown visible
  - [ ] Transparency card visible
  - [ ] Failure warning visible
- [ ] Grid "Mejores prácticas" visible
- [ ] Responsive

---

## Verificación Rápida

```bash
# Componentes existen
ls -la frontend/src/components/ai/
# Debería mostrar 9 .tsx files

# Páginas existen
ls -la frontend/src/pages/
# Debería mostrar AIModelCardsPage.tsx y IAResponsableExamplePage.tsx

# Documentación existe
ls -la docs/guides/
# Debería mostrar IA_RESPONSABLE_*.md files
```

---

## Próximos Pasos

1. **Integrar en router**: Agrega rutas a tu main React file
2. **Actualizar Dashboard**: Agrega componentes a PredictionDashboard.tsx
3. **Navbar links**: Agrega links a `/ai-model-cards` y `/ai-responsable-example`
4. **Testing**: Usa checklist en `IA_RESPONSABLE_CHECKLIST.md`
5. **Deploy**: Sigue guía en `IA_RESPONSABLE_INTEGRATION.md`
6. **Comunicar**: Email template incluido

---

**Inventario versión**: 1.0  
**Creado**: Marzo 2026  
**Status**: ✅ Completo y Documentado
