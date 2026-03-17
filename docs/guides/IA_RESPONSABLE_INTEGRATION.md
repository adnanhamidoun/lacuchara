# Guía de Integración - IA Responsable en AZCA

## 📋 Resumen

Has implementado un estándar completo de IA Responsable con:
1. ✅ Componentes visuales (transparencia, disclaimer, confianza, escenarios fallo)
2. ✅ Páginas de documentación (Model Cards, ejemplo práctico)
3. ✅ Estándar documentado (en `docs/AI_RESPONSIBLE_STANDARD.md`)

Ahora necesitas integrar todo en tu aplicación React.

---

## 🔧 Paso 1: Agregar Rutas al Router

### Localización
Encuentra tu archivo principal de rutas (típicamente `frontend/src/main.tsx`, `frontend/src/App.tsx` o `frontend/src/routes/index.tsx`)

### Código a Agregar

```typescript
import AIModelCardsPage from '../pages/AIModelCardsPage'
import IAResponsableExamplePage from '../pages/IAResponsableExamplePage'

// En tu configuración de rutas, agrega:
const routes = [
  // ... tus rutas existentes ...
  
  {
    path: '/ai-model-cards',
    element: <AIModelCardsPage />,
    label: 'Model Cards IA',
  },
  {
    path: '/ai-responsable-example',
    element: <IAResponsableExamplePage />,
    label: 'Ejemplo IA Responsable',
  },
  
  // ... más rutas ...
]
```

**O si usas React Router v6+**:

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AIModelCardsPage from '../pages/AIModelCardsPage'
import IAResponsableExamplePage from '../pages/IAResponsableExamplePage'

function App() {
  return (
    <Router>
      <Routes>
        {/* Tus rutas existentes */}
        
        <Route path="/ai-model-cards" element={<AIModelCardsPage />} />
        <Route path="/ai-responsable-example" element={<IAResponsableExamplePage />} />
        
        {/* Más rutas */}
      </Routes>
    </Router>
  )
}
```

---

## 📊 Paso 2: Integrar en Dashboard de Predicciones

### Localización
`frontend/src/views/restaurant/PredictionDashboard.tsx` (o similar)

### Importaciones a Agregar

```typescript
// Componentes de IA responsable
import AITransparencyCard from '../../components/ai/AITransparencyCard'
import ServicePredictionTransparency from '../../components/ai/ServicePredictionTransparency'
import MenuPredictionTransparency from '../../components/ai/MenuPredictionTransparency'
import AIDisclaimer from '../../components/ai/AIDisclaimer'
import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'
import AIFailureWarning from '../../components/ai/AIFailureWarning'
import PredictionConfidenceBreakdown from '../../components/ai/PredictionConfidenceBreakdown'
import AIFeedbackButton from '../../components/ai/AIFeedbackButton'
import AISupervisionSection from '../../components/ai/AISupervisionSection'
```

### Integración en Componente

**Antes (Dashboard sin IA responsable)**:
```tsx
export default function PredictionDashboard() {
  return (
    <div className="space-y-8">
      <h1>Predicciones</h1>
      {/* Directamente mostrar predicciones */}
      <ServicePredictions data={serviceData} />
      <MenuPredictions data={menuData} />
    </div>
  )
}
```

**Después (Dashboard con IA responsable)**:
```tsx
export default function PredictionDashboard() {
  const [serviceConfidence, setServiceConfidence] = useState(87)
  const [menuConfidence, setMenuConfidence] = useState(74)

  return (
    <div className="space-y-8">
      <h1>Predicciones - Con Estándares de IA Responsable</h1>

      {/* Banner informativo general */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          🤖 <strong>IA Responsable Activada:</strong> Todos nuestros modelos incluyen información sobre 
          datos usados, limitaciones y nivel de confianza. 
          <a href="/ai-model-cards" className="underline font-semibold ml-1">
            Más información
          </a>
        </p>
      </div>

      {/* Sección 1: Predicción de Servicios */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">📈 Predicción de Servicios</h2>

        <PredictionWithDisclaimer
          title="Servicios Estimados"
          type="service"
          confidenceLevel={serviceConfidence >= 80 ? 'high' : 'medium'}
        >
          <div className="space-y-6">
            {/* Tu contenido de predicción actual */}
            <ServicePredictions data={serviceData} />

            {/* Añadir desglose de confianza */}
            <PredictionConfidenceBreakdown
              overallConfidence={serviceConfidence}
              factors={[
                {
                  name: 'Datos Históricos',
                  score: 92,
                  description: '45 días de historial disponible',
                  impact: 'high',
                },
                {
                  name: 'Patrón Consistente',
                  score: 85,
                  description: 'Demanda semanal predecible',
                  impact: 'high',
                },
                {
                  name: 'Factores Externos',
                  score: 78,
                  description: 'Clima y calendario predecibles',
                  impact: 'medium',
                },
              ]}
            />

            {/* Transparencia completa */}
            <ServicePredictionTransparency />

            {/* Escenarios donde falla */}
            <AIFailureWarning
              scenarios={[
                {
                  scenario: 'Evento local imprevisto',
                  probability: 'high',
                  example: 'Concierto en plaza cercana',
                  whatToDo: 'Ajusta stock manualmente si lo sabes',
                },
                {
                  scenario: 'Cambio de competencia',
                  probability: 'medium',
                  example: 'Cierra competidor cercano',
                  whatToDo: 'Model se adapta en 2-3 semanas',
                },
              ]}
            />
          </div>
        </PredictionWithDisclaimer>
      </div>

      {/* Sección 2: Predicción de Platos */}
      <div className="space-y-6 border-t border-[var(--border)] pt-8">
        <h2 className="text-2xl font-bold">🍽️ Recomendaciones de Platos</h2>

        <PredictionWithDisclaimer
          title="Platos Recomendados"
          type="menu"
          confidenceLevel={menuConfidence >= 80 ? 'high' : menuConfidence >= 60 ? 'medium' : 'low'}
        >
          <div className="space-y-6">
            {/* Tu contenido de predicción de platos actual */}
            <MenuPredictions data={menuData} />

            {/* Desglose de confianza */}
            <PredictionConfidenceBreakdown
              overallConfidence={menuConfidence}
              factors={[
                {
                  name: 'Historial de Órdenes',
                  score: 88,
                  description: '30 días de datos de órdenes',
                  impact: 'high',
                },
                {
                  name: 'Platos Estables',
                  score: 82,
                  description: 'La mayoría sin cambios recientes',
                  impact: 'high',
                },
                {
                  name: 'Platos Nuevos',
                  score: 35,
                  description: '3 platos <2 semanas sin datos',
                  impact: 'high',
                },
              ]}
              explanation="Confianza media: 3 platos nuevos sin historial bajan el score general."
            />

            {/* Transparencia */}
            <MenuPredictionTransparency />

            {/* Escenarios fallo */}
            <AIFailureWarning
              scenarios={[
                {
                  scenario: 'Plato nuevo sin historial',
                  probability: 'high',
                  example: 'Acabas de agregar "Tarta de Zanahoria"',
                  whatToDo: 'Ignora su predicción las primeras 2 semanas',
                },
                {
                  scenario: '"Alucinación": recomienda plato inexistente',
                  probability: 'low',
                  example: 'Sugiere plato que borraste hace 3 meses',
                  whatToDo: 'Raro pero posible. Valida contra menú actual.',
                },
              ]}
            />
          </div>
        </PredictionWithDisclaimer>
      </div>

      {/* Footer con enlace a documentación completa */}
      <div className="text-center p-6 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
        <p>
          Para entender completamente cómo nuestros modelos funcionan:{' '}
          <a href="/ai-model-cards" className="font-semibold underline">
            Ver Model Cards Completas
          </a>
        </p>
      </div>
    </div>
  )
}
```

---

## 🎨 Paso 3: Agregar Links en Menú/Navbar

### Opción A: Menú Principal

En tu navbar/menu principal (`frontend/src/components/layout/Navbar.tsx` o similar):

```tsx
<nav>
  {/* Tus links existentes */}
  <a href="/dashboard">Dashboard</a>
  <a href="/restaurants">Restaurantes</a>
  
  {/* Nuevo: Links a IA Responsable */}
  <div className="submenu">
    <button>🤖 IA Responsable</button>
    <a href="/ai-model-cards">Model Cards</a>
    <a href="/ai-responsable-example">Ver Ejemplo</a>
    <a href="mailto:ia-responsable@azca.es">Reportar Sesgo</a>
  </div>
</nav>
```

### Opción B: Footer

En tu footer:

```tsx
<footer>
  {/* Tu contenido actual */}
  
  {/* Nueva sección */}
  <div>
    <h4>IA Responsable</h4>
    <ul>
      <li><a href="/ai-model-cards">Documentación Modelos</a></li>
      <li><a href="/ai-responsable-example">Ejemplo Práctico</a></li>
      <li><a href="mailto:ia-responsable@azca.es">Contactar</a></li>
    </ul>
  </div>
</footer>
```

---

## 📁 Paso 4: Estructura de Archivos Verificada

Asegúrate de que todos estos archivos existan:

```
frontend/src/
├── components/ai/
│   ├── AITransparencyCard.tsx          ✅ (Creado)
│   ├── AIDisclaimer.tsx                ✅ (Creado)
│   ├── ServicePredictionTransparency.tsx
│   ├── MenuPredictionTransparency.tsx  ✅ (Creado)
│   ├── PredictionWithDisclaimer.tsx    ✅ (Creado)
│   ├── AIFailureWarning.tsx            ✅ (Creado)
│   └── PredictionConfidenceBreakdown.tsx ✅ (Creado)
│
├── pages/
│   ├── AIModelCardsPage.tsx            ✅ (Creado)
│   └── IAResponsableExamplePage.tsx    ✅ (Creado)
│
└── views/restaurant/
    ├── PredictionDashboard.tsx         (Necesita actualización)
    └── RestaurantPanelView.tsx         (Existe - image upload)

docs/
└── AI_RESPONSIBLE_STANDARD.md          ✅ (Creado)
```

---

## 🧪 Paso 5: Testing

### Verificación Visual

1. **Navega a** `/ai-model-cards` → Debe mostrar documentación completa
2. **Navega a** `/ai-responsable-example` → Debe mostrar ejemplo práctico
3. **En Dashboard** → Debe mostrar predicciones con disclaimers

### Verificación de Responsive

- `AITransparencyCard` → Debe verse bien en móvil
- `PredictionWithDisclaimer` → Debe ajustarse a pantalla pequeña
- `AIFailureWarning` → Cards deben apilarse en móvil

### Verificación de Accesibilidad

- Colores: ningún disclaimer debe confiarse SOLO en color
- Contraste: textos deben tener suficiente contraste
- Links: debe ser clara la navegación hacia documentación

---

## 📌 Paso 6: Configuración Recomendada

### Si tienes un sistema de configuración global:

```typescript
// config/ai-responsible.ts
export const AIResponsibleConfig = {
  showTransparencyByDefault: true,
  servicesConfidenceThreshold: 0.75, // Mostrar advertencia si < 75%
  menuConfidenceThreshold: 0.60,
  retrainingFrequency: 'monthly',
  emailContact: 'ia-responsable@azca.es',
  documentationUrl: '/ai-model-cards',
  exampleUrl: '/ai-responsable-example',
}

// Uso en componentes:
import { AIResponsibleConfig } from '../config/ai-responsible'
const showWarning = confidence < AIResponsibleConfig.servicesConfidenceThreshold
```

---

## 🚀 Paso 7: Deployment & Comunicación

### Pre-Deployment

1. **Prueba todas las rutas** en desarrollo
2. **Verifica links no roto** en Model Cards page
3. **Prueba en móvil** - responsividad
4. **Revisa textos** - typos, claridad

### Comunicación a Usuarios

Cuando hagas deploy:

```
📧 EMAIL TEMPLATE

Asunto: 🤖 AZCA implementa IA Responsable

Cuerpo:
Hola,

Nos complace anunciar que implementamos estándares de IA Responsable en AZCA.

Esto significa:
✅ Transparencia total: Sabés qué datos usan nuestros modelos
✅ Honestidad: Documentamos limitaciones y escenarios de error
✅ Privacidad: Nunca datos personales, solo agregados anónimos
✅ Mejora continua: Reentrenamos mensualmente

Nuevo en el app:
📄 Model Cards: /ai-model-cards
📊 Ejemplo práctico: /ai-responsable-example

Las predicciones ahora muestran:
• Nivel de confianza (alto/medio/bajo)
• Qué datos utilizan
• Cuándo pueden fallar
• Cómo mejoramos

Preguntas? Contacta: ia-responsable@azca.es

Saludos,
Equipo AZCA 🤖
```

---

## 🔍 Troubleshooting

### Error: "Componente no encontrado"
```
→ Verifica rutas de import son relativas correctas
→ Asegúrate archivos .tsx créados en `frontend/src/components/ai/`
```

### Estilos rotos
```
→ Verifica usar CSS vars: var(--bg), var(--text), etc.
→ Si falta, agrega a tu CSS global:
   --bg, --surface, --text, --text-muted, --border
```

### Ruta no funciona
```
→ Verifica route exacta en router
→ Asegúrate <PageComponent /> importado correctamente
→ En React Router: usa <Route path="/path" element={<Page />} />
```

---

## 📚 Documentación de Referencia

- **Estándar Completo**: `docs/AI_RESPONSIBLE_STANDARD.md`
- **Componentes**: Ver código comentado en `frontend/src/components/ai/`
- **Ejemplo Real**: `frontend/src/pages/IAResponsableExamplePage.tsx`

---

## 🎯 Próximos Pasos (Futuro)

1. **Añadir datos reales** a componentes (conectar con API)
2. **Analytics**: Trackear si usuarios ven disclaimers
3. **Feedback**: Formulario para reportar sesgo o errores
4. **Certificación**: ISO, SOC2, GDPR formal
5. **Traducción**: Inglés, portugués, etc.

---

**¡Listo! Implementaste un sistema de IA responsable al nivel de empresas como Google y Microsoft.** 🚀

