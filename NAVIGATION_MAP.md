# CUISINE AML - Nueva Estructura de Navegación

## 🗺️ Mapa de Navegación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE: /                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Hero Section + Search Bar                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Segmentos Destacados (Gourmet, Tradicional, Negocios, Familiar)│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Filtros: Cocina | Precio | WiFi | Fin de Semana              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Restaurantes Disponibles (INICIAL: 8)─ Ver todos ──→ /restaurantes│
│  │                                                                    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  │ Rest 1   │  │ Rest 2   │  │ Rest 3   │  │ Rest 4   │         │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  │                                                                    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  │ Rest 5   │  │ Rest 6   │  │ Rest 7   │  │ Rest 8   │         │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  │                                                                    │
│  │  ┌────────────────────────────────────────────────────────┐      │
│  │  │ [Cargar más restaurantes] (+4 cada click)            │      │
│  │  └────────────────────────────────────────────────────────┘      │
│  │                                                                    │
│  └────────────────────────────────────────────────────────────────────┘
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          [Click "Ver todos"]
                                    ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                    CATALOG: /restaurantes                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [← Volver a inicio]                                                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Catálogo Completo                                               │   │
│  │ Explora todos nuestros restaurantes disponibles                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [Búsqueda: ...........................]                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ FILTROS:                                                         │  │
│  │                                                                  │  │
│  │ Segmentos: [All] [Gourmet] [Tradicio...] [Negocios] [Familiar]│  │
│  │                                                                  │  │
│  │ Cocina: [All] [Española] [Italiana] [Asiática] [Francesa] ...  │  │
│  │                                                                  │  │
│  │ Precio: [All] [€15] [€15-25] [€25+]                            │  │
│  │                                                                  │  │
│  │ Servicios: [WiFi] [Fin de Semana]                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ORDENAR POR:                                                     │  │
│  │                                                                  │  │
│  │ [Nombre ↑] [Calificación ↑] [Precio ↑]                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Mostrando 20 restaurantes                                        │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │  │
│  │  │ Rest A   │  │ Rest B   │  │ Rest C   │ ... (todos)          │  │
│  │  └──────────┘  └──────────┘  └──────────┘                      │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │  │
│  │  │ Rest D   │  │ Rest E   │  │ Rest F   │ ... (todos)          │  │
│  │  └──────────┘  └──────────┘  └──────────┘                      │  │
│  │                                    ...                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📍 Puntos Clave

### Homepage (/)
- ✅ Experiencia premium y curada
- ✅ Muestra 8 restaurantes iniciales
- ✅ Load more en batches de 4
- ✅ CTA claro: "Ver todos" → /restaurantes
- ✅ No se siente como "raw database dump"

### Catálogo (/restaurantes)
- ✅ Todos los restaurantes disponibles
- ✅ Filtros avanzados y ordenamiento
- ✅ Experiencia exhaustiva de exploración
- ✅ Back button claramente visible
- ✅ Grid responsive (1-3 columnas)

### Navegación Principal
- ✅ Logo clicable → /
- ✅ Inicio → /
- ✅ Catálogo → /restaurantes
- ✅ Sobre Nosotros → /sobre-nosotros
- ✅ Sin hash anchors complicados

---

## 🔄 Flujos de Usuario

### Flujo 1: Exploración Rápida
1. Usuario llega a homepage (/)
2. Filtra por segmento/cocina
3. Ve 8 restaurantes
4. Si quiere más, click "Cargar más" para ver +4
5. Si quiere acceso completo, click "Ver todos" → /restaurantes

### Flujo 2: Búsqueda Exhaustiva
1. Usuario va a /restaurantes
2. Usa búsqueda, filtros, ordenamiento
3. Ve TODOS los 20+ restaurantes
4. Puede comparar múltiples opciones
5. Selecciona uno y va a ver menú

### Flujo 3: Acceso desde Catálogo
1. Usuario ya está en /restaurantes
2. Explora con filtros/ordenamiento
3. Encuentra restaurante ideal
4. Click en tarjeta → /cliente/restaurantes/:id/menu
5. Ve menú y predicciones

---

## 🎨 Visual Improvements

### Antes
- 16 restaurantes visibles al cargar
- "Cargar más" sumaba 16 de golpe
- Sin link a exploración completa
- Todos los restaurantes en homepage

### Ahora
- **Homepage:** 8 restaurantes (siente más curado)
- **Load more:** 4 restaurantes (exploración gradual)
- **"Ver todos":** Link directo a catálogo
- **Catálogo:** Página dedicada para exploración exhaustiva
- **Navegación:** Limpia y sin complejidad

---

## 📊 Impacto en Performance

| Métrica | Antes | Ahora | Mejora |
|---------|-------|-------|--------|
| Restaurantes iniciales | 16 | 8 | -50% |
| Load more por click | 16 | 4 | Exploración más gradual |
| Rutas | / (con anchors) | / + /restaurantes | Más clara |
| Errores de componentes | Algunos | 0 | ✅ |
| Compilación | OK | ✅ Build exitoso | ✅ |

---

## 🔐 Data Source

**Todos los datos siguen viniendo de:**
- Base de datos Azure SQL Server (azcadb)
- Hook: `useRestaurants()`
- Propiedades: name, google_rating, menu_price, has_wifi, opens_weekends, etc.

**SIN:**
- ❌ Recomendaciones personalizadas fake
- ❌ Datos inventados
- ❌ ML/AI recomendaciones
- ❌ Usuarios sintéticos

---

## ✅ Estado de Implementación

| Componente | Estado | Errores |
|-----------|--------|---------|
| RestaurantsListView | ✅ Actualizado | 0 |
| CatalogView | ✅ Creado | 0 |
| MainLayout | ✅ Actualizado | 0 |
| App.jsx | ✅ Actualizado | 0 |
| Build | ✅ Exitoso | 0 |

---

**Última actualización:** 17 de Marzo de 2026
**Versión:** 1.0
**Tipo:** Refactorización de Arquitectura Frontend
