# ⚡ Quick Start - IA Responsable en 5 Minutos

## 🎯 Objetivo
Agregar componentes de IA Responsable a tu Dashboard existente sin romper nada.

---

## ✅ PASO 1: Verificar que existen archivos (30 segundos)

```bash
# Abre terminal en c:\Users\adnan\Desktop\Azca\

# Verifica componentes
ls frontend/src/components/ai/
# Deberías ver: AITransparencyCard.tsx, AIDisclaimer.tsx, etc.

# Verifica páginas  
ls frontend/src/pages/AI*
# Deberías ver: AIModelCardsPage.tsx, IAResponsableExamplePage.tsx

# Verifica docs
ls docs/guides/IA*
# Deberías ver: IA_RESPONSABLE_*.md files
```

---

## ✅ PASO 2: Agregar rutas (1 minuto)

Abre: `frontend/src/main.tsx` (o tu archivo principal de rutas)

```typescript
// Arriba del archivo, agrega imports:
import AIModelCardsPage from './pages/AIModelCardsPage'
import IAResponsableExamplePage from './pages/IAResponsableExamplePage'

// En tu array de routes/configuración, agrega:
{
  path: '/ai-model-cards',
  element: <AIModelCardsPage />
}
{
  path: '/ai-responsable-example', 
  element: <IAResponsableExamplePage />
}

// Guarda archivo
```

**Prueba en navegador:**
- `http://localhost:5173/ai-model-cards` → ¿Carga?
- `http://localhost:5173/ai-responsable-example` → ¿Carga?

Si dice "Cannot GET", vuelve y chequea los imports y paths.

---

## ✅ PASO 3: Actualizar Dashboard (2 minutos)

Abre: `frontend/src/views/restaurant/PredictionDashboard.tsx` (o donde muestres predicciones)

**Opción A: Cambio Simple (Recomendado para empezar)**

```typescript
// 1. Agrega imports al inicio del archivo
import PredictionWithDisclaimer from '../../components/ai/PredictionWithDisclaimer'

// 2. Encuentra donde renderizas predicciones
// ANTES:
return (
  <div>
    <h2>Servicios</h2>
    {/* tu contenido de servicios */}
  </div>
)

// DESPUÉS:
return (
  <PredictionWithDisclaimer
    title="Predicción de Servicios"
    type="service"
    confidenceLevel="high"
  >
    <div>
      <h2>Servicios</h2>
      {/* tu contenido de servicios - SIN CAMBIOS */}
    </div>
  </PredictionWithDisclaimer>
)

// Listo! Ya tienes:
// - Disclaimer automático
// - Badge de confianza
// - Meta información
```

**Opción B: Cambio Completo (Para después)**

Ver: `IA_RESPONSABLE_INTEGRATION.md` (sección "Integración en Dashboard")

---

## ✅ PASO 4: Probar en Navegador (1 minuto)

1. Abre DevTools (F12)
2. Pestaña "Console" → ¿Algún error rojo?
   - Si: nota el error, mira troubleshooting abajo
   - No: ¡Éxito! 🎉

3. Navega a `/ai-model-cards` → ¿Se ve bien?

4. Navega a tu Dashboard → ¿Aparecen los componentes?

---

## 🆘 Troubleshooting Rápido

### ❌ "AITransparencyCard is not defined"
```
→ Verificar import exacto:
   import AITransparencyCard from '../../components/ai/AITransparencyCard'
   
→ Verificar ruta relativa correcta (contar los ../)
```

### ❌ "Cannot GET /ai-model-cards"
```
→ Route no agregada a router
→ Verificar que importaste página:
   import AIModelCardsPage from './pages/AIModelCardsPage'
→ Verificar que agregaste a routes array
```

### ❌ Estilos rotos (componentes feos)
```
→ Falta CSS variable
→ En root CSS, agregar:
   --bg: #ffffff;
   --surface: #f5f5f5;
   --text: #000000;
   --text-muted: #666666;
   --border: #ddd;
   --surface-soft: rgba(0,0,0,0.02);
```

### ❌ Componente vacío/no muestra nada
```
→ Props mal pasadas
→ Verificar que enviaste props requeridas
→ Ejemplo correcto:
   <PredictionWithDisclaimer
     title="Mi predicción"
     type="service"
     confidenceLevel="high"
   >
     {niños}
   </PredictionWithDisclaimer>
```

---

## 📚 Por Qué Esto es Importante

### Para Ti (Developer)
- ✅ Código reutilizable (usa en múltiples lugares)
- ✅ Estándar internacional (Google, OpenAI lo hacen)
- ✅ Menos trabajo: componentes listos

### Para Usuarios
- ✅ Entienden qué data usa IA
- ✅ Confían más (transparencia)
- ✅ Saben cuándo puede fallar

### Para Empresa
- ✅ Cumplimiento legal (GDPR, EU AI Act)
- ✅ Diferenciación competitiva ("Certified Responsible AI")
- ✅ Sin riesgo regulatorio

---

## 🚀 Próximos Pasos

### Cuando tengas 10 minutos:
- [ ] Leer `IA_RESPONSABLE_RESUMEN_FINAL.md` (overview)
- [ ] Ver `IA_RESPONSABLE_INVENTARIO.md` (tabla completa)

### Cuando tengas 30 minutos:
- [ ] Seguir `IA_RESPONSABLE_INTEGRATION.md` (pasos 1-7)
- [ ] Aggegar links en navbar

### Cuando tengas 1 hora:
- [ ] Hacer testing con `IA_RESPONSABLE_CHECKLIST.md`
- [ ] Deploy a staging

### Cuando todo esté listo:
- [ ] Email a usuarios (template en Integration guide)
- [ ] Deploy a producción

---

## 📊 Estado Después de Quick Start

| Métrica | Valor |
|---------|-------|
| **Tiempo instalación** | ~5 mins |
| **Componentes disponibles** | 9 |
| **Rutas públicas** | 2 |
| **Setup requerido** | Mínimo |
| **Rompe código existente** | No |

---

## 🎓 Si Necesitas Ayuda

### Antes de pedir ayuda:
1. Chequea console (F12) → ¿error línea?
2. Nota el error exacto
3. Busca en Troubleshooting arriba
4. Si no está: check 5 minutos más

### Si aún falla:
```
📧 ia-responsable@azca.es
   Incluye:
   - Error exacto (console)
   - Qué hiciste
   - Archivo donde editaste
```

---

## ✨ Una Vez Funciona

Felicidades! Ya tienes:
- ✅ IA Responsable activa
- ✅ Usuarios entienden limitaciones
- ✅ Cumplimiento regulatorio
- ✅ Ventaja competitiva

Ahora puedes:
- 📊 Monitorear con `AIResponsibleHealthCheck`
- 🔗 Agregar links en navbar
- 📢 Comunicar a usuarios
- 📈 Trackear adoption

---

**Quick Start versión**: 1.0  
**Tiempo estimado**: 5 minutos  
**Dependencias**: Ninguna nueva (solo React)  
**Status**: ✅ Listo para implementar

