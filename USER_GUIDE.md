# CUISINE AML - Guía de Uso Completa

## 🎯 Visión General

CUISINE AML es una plataforma de descubrimiento de restaurantes premium que combina:
- **Homepage curada:** Experiencia premium inicial con 8 restaurantes destacados
- **Catálogo completo:** Exploración exhaustiva con todos los restaurantes disponibles
- **Filtrado avanzado:** Búsqueda inteligente y opciones de ordenamiento
- **Diseño responsivo:** Funciona perfectamente en móvil, tablet y desktop
- **Data-driven:** 100% conectado a base de datos real, sin datos fake

---

## 📱 Cómo Navegar

### 1. **Página de Inicio** (`/`)

**Propósito:** Descubrir restaurantes de forma curada y premium

**Secciones:**
1. **Hero Section**
   - Título principal: "Descubre la Excelencia Gastronómica"
   - Barra de búsqueda global
   - Botón "Buscar" para saltar a resultados

2. **Segmentos Destacados** (4 tarjetas)
   - 🌟 **Gourmet:** Alta cocina y experiencias exclusivas
   - 🏛️ **Tradicional:** Sabores clásicos y cocina auténtica
   - 💼 **Negocios:** Espacios elegantes para reuniones
   - 👨‍👩‍👧‍👦 **Familiar:** Ambiente cercano para compartir
   
   *Click en cualquiera para filtrar*

3. **Filtros**
   - Cocina (Todas, Española, Italiana, Asiática, etc.)
   - Precio (Todos, <€15, €15-25, >€25)
   - Servicios (WiFi disponible, Abre en fin de semana)

4. **Restaurantes Disponibles**
   - Muestra **8 restaurantes inicialmente**
   - Indica: "Mostrando 8 de 20 resultados"
   - **Link "Ver todos"** en la esquina → Catálogo completo
   - **Botón "Cargar más restaurantes"** para agregar +4

5. **Footer**
   - Información de CUISINE AML
   - Links a Soporte, Legal
   - Links de desarrolladores (Mario, Adnan, Lucian)

### 2. **Catálogo Completo** (`/restaurantes`)

**Propósito:** Explorar y comparar todos los restaurantes disponibles

**Estructura:**

**a) Encabezado**
- Botón "← Volver a inicio"
- Título: "Catálogo Completo"
- Subtítulo: "Explora todos nuestros restaurantes disponibles"

**b) Búsqueda Global**
- Busca en: Nombre, zona, estilo
- En tiempo real (deferred search)
- Acceso desde cualquier parte de la página

**c) Sistema de Filtros** (Todo lo de homepage + más)

**Segmentos:**
- [ ] Gourmet  [ ] Tradicional  [ ] Negocios  [ ] Familiar

**Cocina:**
- [ ] Todas  [ ] Española  [ ] Italiana  [ ] Asiática  [ ] Francesa  [ ] Portuguesa  [ ] Latinoamericana  [ ] Moderna

**Precio:**
- [ ] Todos  [ ] Hasta €15  [ ] €15-25  [ ] Más de €25

**Servicios:**
- [ ] WiFi disponible  [ ] Abre en fin de semana

**d) Ordenamiento**
- **Por Nombre (A-Z):** Alfabético
- **Por Calificación (★):** Mejor calificado primero
- **Por Precio (€):** Menor precio primero
- **Toggle ↑↓:** Cambiar orden ascendente/descendente

Ejemplo: Click en "Calificación ↓" muestra peor calificado primero

**e) Resultados**
- **Contador:** "Mostrando 20 restaurantes"
- **Grid responsive:**
  - Mobile: 1 columna
  - Tablet: 2 columnas
  - Desktop: 3 columnas
- **Click en tarjeta:** Ir a menú del restaurante

### 3. **Página "Sobre Nosotros"** (`/sobre-nosotros`)

**Secciones:**
- Hero con logo completo
- Descripción de AML
- Features destacadas
- Team (Mario, Adnan, Lucian)
- Links a LinkedIn de desarrolladores

---

## 🔍 Funcionalidades Principales

### Búsqueda

**¿Cómo buscar?**
1. Escribe en el campo de búsqueda
2. Busca en: nombre, zona, estilo, cocina
3. Se actualiza en tiempo real
4. Los resultados se filtran instantáneamente

**Ejemplos:**
- Escribe "italiano" → Muestra restaurantes con cocina italiana
- Escribe "gourmet" → Muestra segmento gourmet
- Escribe "centro" → Si está en nombre/descripción
- Escribe "paella" → Busca en todas partes

### Filtros

**¿Cómo filtrar?**

1. **Por Segmento:** Click en las tarjetas destacadas
   - Gourmet → Solo restaurantes gourmet
   - Tradicional → Solo restaurantes tradicionales
   - etc.

2. **Por Cocina:** Click en chips de cocina
   - Combina con otros filtros
   - "Todas" para remover este filtro

3. **Por Precio:** Click en chips de rango
   - Filtra por presupuesto
   - Se puede combinar con cocina

4. **Por Servicios:**
   - WiFi: Click para ver solo con WiFi
   - Fin de semana: Click para ver solo los que abren

**Ejemplo de filtrado combinado:**
1. Click "Gourmet" (segmento)
2. Click "Italiana" (cocina)
3. Click "Más de €25" (precio)
→ Muestra: Restaurantes gourmet, italianos, caros

### Ordenamiento

**¿Cómo ordenar?**

Click en uno de los botones:

1. **Nombre ↑/↓**
   - ↑ A-Z alfabético
   - ↓ Z-A alfabético inverso

2. **Calificación ↑/↓**
   - ↑ Mejor calificado primero (5⭐ first)
   - ↓ Peor calificado primero (1⭐ first)

3. **Precio ↑/↓**
   - ↑ Más barato primero
   - ↓ Más caro primero

**Toggle:** Click el mismo botón de nuevo para cambiar dirección

---

## 📊 Tarjetas de Restaurante

### Información mostrada:

```
┌─────────────────────────────────┐
│  [IMAGEN]            [⭐ 4.5]   │
│  [Abierto hoy]                  │
├─────────────────────────────────┤
│  Nombre del Restaurante         │
│  Cocina: Italiana               │
│                                 │
│  [Gourmet]                      │
├─────────────────────────────────┤
│  [WiFi]              €25        │
└─────────────────────────────────┘
```

**Elementos:**
- **Imagen:** Foto del lugar (o placeholder)
- **Rating:** Calificación Google (0-5⭐)
- **Badge "Abierto hoy":** Si es fin de semana y abre fin de semana
- **Nombre:** Nombre del restaurante
- **Cocina:** Tipo de cocina
- **Segmento:** Categoría (Gourmet, etc.) si aplica
- **WiFi:** Si tiene disponible
- **Precio:** Rango de precio aproximado del menú

### Interacción:
- **Click en tarjeta:** Abre menú del restaurante
- **Hover:** Imagen se amplía ligeramente (zoom effect)
- **Animación:** Entrada suave desde arriba

---

## 🌙 Modo Oscuro/Claro

**¿Cómo cambiar?**
1. Botón en el header (top-right)
2. 🌙 Modo oscuro / ☀️ Modo claro
3. Se guarda en localStorage automáticamente

**Afecta:**
- Fondo de página
- Texto
- Tarjetas
- Filtros
- Todo el UI

---

## 📋 Ejemplos de Uso

### Caso 1: Quiero comer italiano esta noche

1. Ve a homepage (/)
2. Busca "italiano" O click en "Todas las cocinas" → "Italiana"
3. Filtra por precio si quieres
4. Click en restaurante que te guste
5. Ves menú de hoy
6. Haces reserva

### Caso 2: Quiero explorar TODOS los gourmet

1. Ve a /restaurantes
2. Click en chip "Gourmet" (segmento)
3. Ahora ves solo gourmet
4. Ordena por "Calificación ↑" para mejores primero
5. Compara opciones

### Caso 3: Soy alérgico, quiero restaurante con WiFi

1. Ve a /restaurantes
2. Busca tu tipo de cocina (ej. "vegetariana")
3. Click en "WiFi disponible"
4. Ordena como quieras
5. Verás solo vegetariana + WiFi

### Caso 4: Presupuesto limitado, pero quiero lo mejor

1. Ve a /restaurantes
2. Click en "Hasta €15" (precio)
3. Ordena por "Calificación ↑"
4. Verás lo mejor de lo barato
5. Selecciona tu favorito

---

## 🎨 Diseño y Experiencia

### Colores principales:
- **Naranja (#E07B54):** Accents, CTAs, highlights
- **Dorado (#D4AF37):** Ratings
- **Azul (#4F8CFF):** Acentos secundarios
- **Blanco/Gris:** Background y texto

### Tipografía:
- **Títulos:** Font bold, tamaño grande
- **Subtítulos:** Font medium
- **Bodycopy:** Regular, tamaño pequeño
- **Accents:** Semibold en color

### Espaciado:
- **Generoso:** Mucho breathing room
- **Premium feel:** No abarrotado
- **Jerarquía clara:** Título > Subtítulo > Contenido

### Animaciones:
- Entrada suave (fade-in)
- Hover effects en botones
- Transiciones smooth (200ms)
- Loading states claros

---

## ♿ Accesibilidad

- Contraste suficiente en todos los textos
- Botones con aria-labels claros
- Navegación por teclado soportada
- Imágenes con alt text
- Formulas funcionales sin JavaScript (fallbacks)

---

## 🔐 Privacidad

- **Búsquedas:** No se guardan (localStorage solo para theme)
- **Filtros:** Se limpian al recargar
- **Datos:** 100% de base de datos pública
- **Cookies:** Solo tema (dark/light)

---

## ⚡ Performance

- **Initial load:** ~8 restaurantes (rápido)
- **Load more:** Incremental (+4 de a vez)
- **Búsqueda:** Deferred para no bloquear UI
- **Grid:** Responsive sin jank
- **Mobile:** Optimizado para 4G lento

---

## 🐛 Troubleshooting

### "No veo restaurantes"
→ Verifica los filtros, resetea a "Todos"

### "La búsqueda no funciona"
→ Recarga la página, intenta sin acentos

### "Me va lento"
→ Desactiva WiFi filter si está activado, cierra tabs

### "Modo oscuro no se guarda"
→ Verifica que localStorage no esté bloqueado

### "Botón no responde"
→ Intenta en otra browser, limpiar caché

---

## 📞 Soporte

**¿Preguntas?**
- Email: support@cuisineaml.com
- Links en footer a desarrolladores:
  - Mario García (LinkedIn)
  - Adnan Hamidoun (LinkedIn)
  - Lucian Ciusa (LinkedIn)

---

## 🚀 Próximas Mejoras (Roadmap)

- [ ] Página de menús diarios (/menus)
- [ ] Favoritos/Wishlist
- [ ] Historial de búsquedas
- [ ] Reseñas de usuarios
- [ ] Reservas integradas
- [ ] Notificaciones de promos
- [ ] Integración de mapas
- [ ] Recomendaciones personalizadas (opt-in)

---

**Última actualización:** 17 de Marzo de 2026
**Versión:** 1.0
**Estado:** ✅ Producción
