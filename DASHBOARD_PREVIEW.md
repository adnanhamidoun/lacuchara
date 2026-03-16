# 📊 LO QUE VERÁS EN EL DASHBOARD

## Admin Dashboard - Vista General

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [Logo Naranja]  Dashboard Administrativo                   │
│                  Control central de restaurantes y menús    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ 20               │  │ 0                │  │ 0          │ │
│  │ Restaurantes     │  │ Solicitudes      │  │ Aprobadas  │ │
│  │ Activos          │  │ Pendientes       │  │ Semana     │ │
│  │ (VERDE)          │  │ (NARANJA)        │  │ (AZUL)     │ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Solicitudes Pendientes] [Historial]  [Restaurantes (20)]  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  RESTAURANTES ACTIVOS:                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [AZ]  Azca Prime Grill                          [X] │    │
│  │       🍽️ Grill  |  Capacidad: 91                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [CT]  Castellana Tradición                     [X] │    │
│  │       🍽️ Spanish  |  Capacidad: 63                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [BP]  Business Pasta Hub                      [X] │    │
│  │       🍽️ Italian  |  Capacidad: 61                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ... (17 más restaurantes)                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Logos Dinámicos

Si no hay imagen subida, se mostrará un círculo con las **iniciales del restaurante**:

```
┌─────────────────────────────────────────────────────────┐
│ [AZ]  Azca Prime Grill                              [X] │  → AZ (Azca)
│ [CT]  Castellana Tradición                         [X] │  → CT (Castellana Tradición)
│ [BP]  Business Pasta Hub                          [X] │  → BP (Business Pasta)
│ [SI]  Skyline Italian                             [X] │  → SI (Skyline Italian)
│ [PF]  Picasso Fine Dining                         [X] │  → PF (Picasso Fine)
│ [HA]  Heritage Azca                               [X] │  → HA (Heritage Azca)
└─────────────────────────────────────────────────────────┘
```

### Pasar Mouse Sobre Logo

```
Al pasar el mouse sobre cualquier logo, aparece un ícono de cámara:

┌─────────────────────────────────────────────────────────┐
│ [AZ]  Azca Prime Grill                              [X] │
│  ↓                                                       │
│ [ 📷 ]  Azca Prime Grill                              [X] │  ← Ícono de cámara
│        🍽️ Grill  |  Capacidad: 91                      │
└─────────────────────────────────────────────────────────┘
```

---

## Modal para Cambiar Imagen

Cuando haces click en el logo:

```
┌──────────────────────────────────────────────────────┐
│ Cambiar imagen del restaurante                    [X] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [Preview de la imagen actual o placeholder]        │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Seleccionar imagen: [Seleccionar archivo]          │
│                                                       │
│  [Cancelar]                [Guardar]                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Detalles de Cada Restaurante

Cada tarjeta muestra:

```
┌─────────────────────────────────────────────────────┐
│  [LOGO] Nombre Restaurante                     [X] │
│         🍽️ Tipo de Cocina  |  Capacidad: NN        │
└─────────────────────────────────────────────────────┘
```

### Ejemplos Reales:

```
┌─────────────────────────────────────────────────────┐
│  [AZ] Azca Prime Grill                        [X] │
│       🍽️ Grill  |  Capacidad: 91                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [CT] Castellana Tradición                    [X] │
│       🍽️ Spanish  |  Capacidad: 63                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [BP] Business Pasta Hub                     [X] │
│       🍽️ Italian  |  Capacidad: 61                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [SI] Skyline Italian                        [X] │
│       🍽️ Italian  |  Capacidad: 101               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [PF] Picasso Fine Dining                    [X] │
│       🍽️ Italian  |  Capacidad: 57                │
└─────────────────────────────────────────────────────┘
```

---

## Colores Usados

- **Logo Circle**: Gradiente naranja `#E07B54` → `#D88B5A`
- **Border**: Naranja `border-[#E07B54]` (2px)
- **KPIs**:
  - Verde: `#4CAF50` (Restaurantes Activos)
  - Naranja: `#E07B54` (Solicitudes Pendientes)
  - Azul: `#2196F3` (Aprobadas esta semana)
- **Fondo**: Degradado oscuro `var(--surface)`
- **Texto**: Blanco en logos, gris en detalles

---

## Flujo de Interacción

### 1. Ver Dashboard
```
Login → http://127.0.0.1:8000/admin → Dashboard
```

### 2. Ver Restaurantes
```
Dashboard → Tab "Restaurantes Activos (20)" → Lista de 20 restaurantes
```

### 3. Cambiar Logo de Restaurante
```
Pasar mouse sobre logo
  ↓
Click en ícono de cámara
  ↓
Seleccionar archivo local
  ↓
Preview en tiempo real
  ↓
Click "Guardar"
  ↓
Logo se actualiza en tiempo real (si servidor está corriendo)
```

---

## 20 Restaurantes Visibles

1. **[AZ]** Azca Prime Grill
2. **[CT]** Castellana Tradición
3. **[BP]** Business Pasta Hub
4. **[SI]** Skyline Italian
5. **[PF]** Picasso Fine Dining
6. **[HA]** Heritage Azca
7. **[PM]** Plaza Mayor Grill
8. **[AM]** Azure Med Terrace
9. **[PN]** Piazza del Norte
10. **[TM]** Titanium Mediterranean
11. **[TT]** Tuscan Tower
12. **[PM]** Perón Med Kitchen
13. **[IE]** Iron & Ember
14. **[PA]** Puerta de Azca
15. **[SB]** Summit Spanish Bistro
16. **[BR]** Black Rock Grill
17. **[OB]** Orense Blue Terrace
18. **[TB]** The Boardroom Bistro
19. **[FD]** Financial District Grill
20. **[MM]** Metro & Mozzarella

---

## Acciones Disponibles

### En Cada Restaurante:

| Acción | Descripción |
|--------|------------|
| **Pasar mouse en logo** | Aparece ícono de cámara |
| **Click en logo** | Abre modal para cambiar imagen |
| **Click X rojo** | Elimina el restaurante (con confirmación) |
| **Ver detalles** | Haz click en el nombre para ver más info |

---

## Estados de la UI

### Logo Inactivo
```
[AZ] - círculo con iniciales, borde naranja, texto blanco
```

### Logo Hover (mouse encima)
```
[📷] - overlay oscuro aparece, ícono de cámara visible, cursor pointer
```

### Logo con Imagen
```
[IMAGEN] - cuando se sube una foto, aparece la imagen en lugar de iniciales
```

---

## Resumen

✅ **Dashboard mejorado**:
- Logo naranja en header
- KPIs números sin fondo (colores directo)
- 20 restaurantes listados
- Logos circulares con iniciales
- Cambiar foto con modal
- Borrar restaurante con botón
- Toda la UI es responsive

📱 **Funciona en**:
- Desktop (pantalla grande)
- Tablet (2 columnas)
- Mobile (1 columna)

---

**Pruébalo ejecutando `run_server.bat` y abriendo http://127.0.0.1:8000** ✨
