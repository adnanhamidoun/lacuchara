# 📝 Instrucciones: Agregar URLs de LinkedIn

## Ubicaciones para actualizar

### 1. **AboutView.tsx** - Sección de Equipo Desarrollador
Archivo: `frontend/src/views/client/AboutView.tsx` (líneas 6-15)

```tsx
const developers = [
  {
    name: 'Mario García',
    linkedinUrl: 'https://linkedin.com/in/...', // ← REEMPLAZA AQUÍ
  },
  {
    name: 'Adnan Hamidoun',
    linkedinUrl: 'https://linkedin.com/in/...', // ← REEMPLAZA AQUÍ
  },
  {
    name: 'Lucian Ciusa',
    linkedinUrl: 'https://linkedin.com/in/...', // ← REEMPLAZA AQUÍ
  },
]
```

### 2. **RestaurantsListView.tsx** - Footer
Archivo: `frontend/src/views/client/RestaurantsListView.tsx` (líneas 529-549)

```tsx
<a
  href="https://linkedin.com/in/mario-garcia" // ← REEMPLAZA AQUÍ
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
>
  <Linkedin size={14} />
  Mario García
</a>

<a
  href="https://linkedin.com/in/adnan-hamidoun" // ← REEMPLAZA AQUÍ
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
>
  <Linkedin size={14} />
  Adnan Hamidoun
</a>

<a
  href="https://linkedin.com/in/lucian-ciusa" // ← REEMPLAZA AQUÍ
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
>
  <Linkedin size={14} />
  Lucian Ciusa
</a>
```

## ¿Cómo obtener tu URL de LinkedIn?

1. Ve a tu perfil de LinkedIn
2. Haz clic en "Copiar URL del perfil" (en el botón de "...") o simplemente copia la URL de la barra del navegador
3. Debe verse como: `https://linkedin.com/in/tu-nombre-user-id` o `https://www.linkedin.com/in/tu-nombre`

## Formato esperado

✅ Válido:
- `https://linkedin.com/in/mario-garcia`
- `https://www.linkedin.com/in/mario-garcia-123456`
- `https://linkedin.com/in/mario-garcia/`

❌ Inválido:
- `linkedin.com/in/mario-garcia` (falta https)
- `Mario García` (solo nombre)
- (vacío)

## Después de actualizar

Una vez agregues los URLs:
1. Guarda los cambios
2. Recarga la aplicación
3. Verifica que los enlaces de LinkedIn funcionen correctamente
4. Los desarrolladores aparecerán en:
   - La página "Sobre Nosotros" (`/sobre-nosotros`)
   - El footer de la página principal
