# ✅ Checklist de Implementación - IA Responsable

Use este checklist para verificar que toda la implementación de IA Responsable está correcta.

---

## 🔧 PHASE 1: Verificación de Archivos

- [ ] **Componentes creados** (11 archivos en `frontend/src/components/ai/`)
  - [ ] `AITransparencyCard.tsx` existe
  - [ ] `AIDisclaimer.tsx` existe
  - [ ] `ServicePredictionTransparency.tsx` existe
  - [ ] `MenuPredictionTransparency.tsx` existe
  - [ ] `PredictionWithDisclaimer.tsx` existe
  - [ ] `AIFailureWarning.tsx` existe
  - [ ] `PredictionConfidenceBreakdown.tsx` existe
  - [ ] `AIResponsibleHealthCheck.tsx` existe
  - [ ] `AIResponsibleBadge.tsx` existe
  - [ ] `AIFeedbackButton.tsx` existe (NUEVO)
  - [ ] `AISupervisionSection.tsx` existe (NUEVO)

- [ ] **Páginas creadas** (2 archivos en `frontend/src/pages/`)
  - [ ] `AIModelCardsPage.tsx` existe
  - [ ] `IAResponsableExamplePage.tsx` existe

- [ ] **Documentación** (en `docs/`)
  - [ ] `docs/AI_RESPONSIBLE_STANDARD.md` existe
  - [ ] `docs/guides/IA_RESPONSABLE_INTEGRATION.md` existe
  - [ ] `docs/guides/IA_RESPONSABLE_RESUMEN_FINAL.md` existe

---

## 🛠️ PHASE 2: Integración en Router

**Archivo**: `frontend/src/main.tsx` o tu archivo de rutas principal

- [ ] Importar `AIModelCardsPage`:
  ```typescript
  import AIModelCardsPage from './pages/AIModelCardsPage'
  ```

- [ ] Importar `IAResponsableExamplePage`:
  ```typescript
  import IAResponsableExamplePage from './pages/IAResponsableExamplePage'
  ```

- [ ] Agregar ruta para `/ai-model-cards`:
  ```typescript
  { path: '/ai-model-cards', element: <AIModelCardsPage /> }
  ```

- [ ] Agregar ruta para `/ai-responsable-example`:
  ```typescript
  { path: '/ai-responsable-example', element: <IAResponsableExamplePage /> }
  ```

- [ ] Probar en navegador:
  - [ ] `http://localhost:5173/ai-model-cards` → carga correctamente
  - [ ] `http://localhost:5173/ai-responsable-example` → carga correctamente

---

## 📊 PHASE 3: Integración en Dashboard de Predicciones

**Archivo**: `frontend/src/views/restaurant/PredictionDashboard.tsx` (o similar)

- [ ] Importar componentes:
  ```typescript
  import AITransparencyCard from '../../components/ai/AITransparencyCard'
  import ServicePredictionTransparency from '../../components/ai/ServicePredictionTransparency'
  import MenuPredictionTransparency from '../../components/ai/MenuPredictionTransparency'
  import AIDisclaimer from '../../components/ai/AIDisclaimer'
  import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'
  import AIFailureWarning from '../../components/ai/AIFailureWarning'
  import PredictionConfidenceBreakdown from '../../components/ai/PredictionConfidenceBreakdown'
  ```

- [ ] Agregar disclaimer general al inicio del dashboard
  ```typescript
  <AIDisclaimer 
    type="info"
    title="IA Responsable Activada"
    message="Todas nuestras predicciones incluyen transparencia sobre datos..."
  />
  ```

- [ ] Envolver sección de Servicios con `PredictionWithDisclaimer`:
  ```typescript
  <PredictionWithDisclaimer
    title="Predicción de Servicios"
    type="service"
    confidenceLevel="high"
  >
    {/* Contenido de servicios */}
  </PredictionWithDisclaimer>
  ```

- [ ] Envolver sección de Platos con `PredictionWithDisclaimer`:
  ```typescript
  <PredictionWithDisclaimer
    title="Predicción de Platos"
    type="menu"
    confidenceLevel="medium"
  >
    {/* Contenido de platos */}
  </PredictionWithDisclaimer>
  ```

- [ ] Probar que los cambios se ven correctamente

---

## 🎨 PHASE 4: Verificación Visual

- [ ] **Component: AITransparencyCard**
  - [ ] Muestra icono 🤖
  - [ ] Muestra nivel de confianza (coloreado)
  - [ ] Lista "Datos que utiliza" correctamente
  - [ ] Lista "Limitaciones" correctamente
  - [ ] Responsive en móvil

- [ ] **Component: AIDisclaimer**
  - [ ] Tipo "warning" muestra en naranja ⚠️
  - [ ] Tipo "info" muestra en azul ℹ️
  - [ ] Tipo "error" muestra en rojo ❌
  - [ ] Texto legible
  - [ ] Responsive en móvil

- [ ] **Component: PredictionWithDisclaimer**
  - [ ] Muestra título
  - [ ] Barra de confianza visible y correcta
  - [ ] Disclaimer automático aparece
  - [ ] Meta información al pie
  - [ ] Responsive en móvil

- [ ] **Component: PredictionConfidenceBreakdown**
  - [ ] Muestra confianza general (%)
  - [ ] Barra de progreso animada
  - [ ] Lista factores con barras individuales
  - [ ] Colores correctos por factor
  - [ ] Descripción de cada factor

- [ ] **Component: AIFailureWarning**
  - [ ] Muestra escenarios claramente
  - [ ] Probabilidad coloreada (rojo/naranja/verde)
  - [ ] Ejemplos claros
  - [ ] "Qué hacer" ayuda al usuario
  - [ ] Responsive en móvil

- [ ] **Component: ServicePredictionTransparency**
  - [ ] Muestra datos usados (5 items)
  - [ ] Muestra limitaciones (5 items)
  - [ ] Icono + texto para cada dato
  - [ ] Nivel confianza correcto

- [ ] **Component: MenuPredictionTransparency**
  - [ ] Muestra datos usados (6 items)
  - [ ] Muestra limitaciones (6 items)
  - [ ] Menciona explícitamente "alucinaciones de IA"
  - [ ] Nivel confianza correcto

- [ ] **Page: AIModelCardsPage**
  - [ ] Carga sin errores
  - [ ] Título visible
  - [ ] Sección 1: Servicios → carga transparencia
  - [ ] Sección 2: Platos → carga transparencia
  - [ ] FAQs: expandibles/colapsibles funcionan
  - [ ] Links a `/ai-responsable-example` funcionan

- [ ] **Page: IAResponsableExamplePage**
  - [ ] Carga sin errores
  - [ ] Ejemplo 1: Servicios visible
  - [ ] Ejemplo 2: Platos visible
  - [ ] Desglose de confianza visible
  - [ ] Escenarios de fallo visible
  - [ ] Grid de mejores prácticas visible
  - [ ] Responsive en móvil

---

## 🔍 PHASE 5: Probar en Navegador

**Abre console (F12) y verifica NO hay errores de:**

- [ ] Imports faltantes
- [ ] Componentes no definidos
- [ ] CSS variables no definidas (`--bg`, `--text`, etc.)
- [ ] Runtime errors

**Navega y prueba:**
- [ ] `/ai-model-cards` → Carga sin errores
- [ ] `/ai-responsable-example` → Carga sin errores
- [ ] Dashboard con predicciones → Componentes visibles
- [ ] Prueba click en detalles/FAQ
- [ ] Prueba resize de ventana → Responsive OK

---

## 📱 PHASE 6: Responsive Testing

Abre DevTools (F12) y selecciona dispositivos:

- [ ] **iPhone 12** (390px)
  - [ ] AITransparencyCard se ajusta
  - [ ] Grid FAQs se apila
  - [ ] Texto legible (no truncado)

- [ ] **iPad** (768px)
  - [ ] Dos columnas visible si es necesario
  - [ ] Padding proporcional

- [ ] **Desktop** (1920px)
  - [ ] Max-width respetado (4xl)
  - [ ] Layout óptimo

---

## ♿ PHASE 7: Accesibilidad Básica

- [ ] **Colores no son única información**
  - [ ] Cada color tiene icono o texto
  - [ ] "Confianza Alta" no confía solo en color verde

- [ ] **Contraste suficiente**
  - [ ] Texto oscuro sobre fondo claro → OK
  - [ ] Texto claro sobre fondo oscuro → OK

- [ ] **TAB navigation**
  - [ ] Puedes navegar todo con TAB
  - [ ] Orden lógico de tabs
  - [ ] Botones/links tienen focus visible

- [ ] **Links descriptivos**
  - [ ] No dice solo "aquí" o "más"
  - [ ] Dice "Ver Model Cards Completas"

---

## 🔗 PHASE 8: Links Internos

- [ ] En `AIModelCardsPage`:
  - [ ] Link a `/ai-responsable-example` funciona
  - [ ] Email `ia-responsable@azca.es` es clickeable (mailto:)

- [ ] En Dashboard:
  - [ ] Link a `/ai-model-cards` funciona desde disclaimer

- [ ] En Navbar/Menu (si agregaste):
  - [ ] Link a `/ai-model-cards` funciona
  - [ ] Link a `/ai-responsable-example` funciona

---

## 📧 PHASE 9: Información de Contacto

- [ ] Email `ia-responsable@azca.es` aparece en múltiples lugares:
  - [ ] `AIModelCardsPage` (footer)
  - [ ] FAQ sobre reportar sesgos
  - [ ] `IAResponsableExamplePage` (conclusión)

- [ ] Puedes crear formulario de contacto:
  - [ ] Opción: simple formulario en página
  - [ ] Opción: email link con asunto predefinido

---

## 📊 PHASE 10: Datos Realistas

Si conectaste APIs reales:

- [ ] Componentes muestran datos reales
- [ ] Confianza es % real del modelo
- [ ] Últimas actualizaciones son correctas
- [ ] Meta información es precisa

Si aún son datos simulados:

- [ ] Documentar que son ejemplos (DONE - dice "simulación")
- [ ] Preparar endpoint que devuelva datos reales
- [ ] Plan: reemplazar data simulada → data real en producción

---

## 🚀 PHASE 11: Antes de Deploy

- [ ] Todos los puntos anteriores: ✅
- [ ] No hay console errors
- [ ] Build sin warnings:
  ```bash
  npm run build
  ```
- [ ] ProductionBuild funciona localmente

- [ ] Checklist de Deploy:
  ```
  □ Commit a main/develop
  □ CI/CD pipeline verde
  □ Deploy a staging
  □ Tests end-to-end OK
  □ Deploy a producción
  □ Monitor Sentry/logs
  ```

---

## 📢 PHASE 12: Comunicación a Usuarios

Después de deploy:

- [ ] Escribir changelog:
  ```
  🤖 Nuevo: Estándares de IA Responsable
  - Model Cards públicas en /ai-model-cards
  - Transparencia en todas las predicciones
  - Documentación: /ai-responsable-example
  ```

- [ ] Email a usuarios (usa template en `IA_RESPONSABLE_INTEGRATION.md`)

- [ ] Social media post

- [ ] Landing page update (si existe)

---

## � PHASE 13: Testing de Nuevos Componentes

### ✅ AIFeedbackButton
- [ ] Muestra 3 opciones: 👍 (Buena), 👌 (Regular), 👎 (Mala)
- [ ] Click en botón: cambia color y estilo
- [ ] Mensaje "Gracias por tu feedback" aparece después
- [ ] Mensaje desaparece después de 3 segundos automáticamente
- [ ] Responsive: botones no se solapan en móvil
- [ ] Texto descriptivo visible: "¿Qué te parece esta predicción?"
- [ ] Información adicional: "Tu feedback ayuda a mejorar"
- [ ] Versión "onlyIcon=true": solo emojis sin texto

### ✅ AISupervisionSection
- [ ] Header visible: "Control Humano en IA"
- [ ] Descripción clara: "Tú siempre tienes el control"
- [ ] Si showDetails=true:
  - [ ] 4 secciones visibles (Transparencia, Tu Voto, Rechazo, Explicable)
  - [ ] Cada una con emoji + título + descripción
- [ ] Si showDetails=false:
  - [ ] Header visible
  - [ ] Detalles ausentes (colapsado)
- [ ] Cita inspiradora al pie
- [ ] Responsive: contenido se apila en móvil

### ✅ Integración en IAResponsableExamplePage
- [ ] AIFeedbackButton visible en ejemplo de servicios
- [ ] AIFeedbackButton visible en ejemplo de platos
- [ ] AISupervisionSection visible en sección dedicada
- [ ] Sección "Control Humano" entre ejemplos y conclusión

---

## 🎯 Final Verification

**Responde SI a todo lo siguiente:**

- [ ] ¿Todos los archivos (11+2+docs) existen?
- [ ] ¿Incluye nuevos componentes de feedback y supervisión?
- [ ] ¿Rutas funcionan sin errores?
- [ ] ¿Dashboard muestra componentes?
- [ ] ¿Componentes se ven bien en móvil?
- [ ] ¿No hay errores en console?
- [ ] ¿FAQs/detalles son expandibles?
- [ ] ¿Links internos funcionan?
- [ ] ¿Build de producción OK?
- [ ] ¿Botones de feedback son estéticos pero no funcionales?

**Si respondiste SÍ a todo → ¡Listo para deploy!** 🚀

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Módulo no encontrado" | Verifica ruta import relativa |
| Estilos rotos | CSS vars (`--bg`, etc.) definidas? |
| Ruta 404 | Router configurado? Route exists? |
| Componente vacío | Props pasadas? Data es null? |
| Responsive roto | Tailwind instalado? Config OK? |
| No carga datos reales | ¿Aún datos simulados? Plan: conectar API |

---

**Checklist versión**: 1.0  
**Última actualización**: Marzo 2026  
**Estado**: ✅ Listo para implementación
