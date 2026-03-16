# Servidor de Archivos Estáticos - Configuración FastAPI

## ✅ Configuración Completada

Se ha configurado FastAPI para servir archivos estáticos (frontend React) desde la carpeta `backend/api/static/`.

### Cambios Realizados:

#### 1. **Importar StaticFiles** (main.py, línea 23)
```python
from fastapi.staticfiles import StaticFiles
```

#### 2. **Montar la Carpeta Estática** (main.py, después del middleware CORS)
```python
# Configurar servidor de archivos estáticos para React
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    logger.info(f"📁 Servidor de archivos estáticos montado en {static_dir}")
else:
    logger.warning(f"⚠️  Carpeta estática no encontrada en {static_dir}")
```

### Parámetros Clave:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `directory` | `backend/api/static` | Ruta absoluta a la carpeta con archivos estáticos |
| `html=True` | `True` | Activa "fallback a index.html" - cuando se accede a una ruta sin extensión de archivo estática, sirve index.html automáticamente |
| `name="static"` | `name="static"` | Nombre opcional para referencia en la app |

---

## 🎯 ¿Qué Hace `html=True`?

Con `html=True` habilitado, FastAPI automáticamente:

1. **Busca el archivo exacto** - Si accedes a `/about.html`, sirve ese archivo
2. **Fallback a index.html** - Si accedes a `/about` (sin extensión), sirve `index.html`
3. **Permite routing del frontend** - React Router puede manejar rutas sin necesidad de ficheros reales

### Ejemplo:

```
GET / → Sirve index.html ✅
GET /about → Sirve index.html (React maneja el routing) ✅
GET /css/style.css → Sirve el archivo si existe ✅
GET /api/health → Accede a endpoint de API (routing correcto) ✅
```

---

## 📁 Estructura de Carpetas

```
backend/api/
├── static/                 ← Archivos estáticos (React build)
│   ├── index.html         ← Archivo HTML principal
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── assets/
│       ├── images/
│       └── fonts/
├── main.py               ← Aplicación FastAPI (CONFIGURADA ✅)
├── __init__.py
└── __pycache__/
```

---

## 🚀 Cómo Usar

### Opción 1: Integrar tu Frontend React Build

```bash
# 1. Construir el frontend
cd frontend
npm run build

# 2. Copiar archivos estáticos
xcopy "dist\*" "..\backend\api\static\" /E /I /Y

# 3. Reiniciar la API
cd ../backend
python -m uvicorn api.main:app --reload
```

### Opción 2: Desarrollo Local (Recomendado)

Durante el desarrollo, ejecuta ambos servidores en paralelo:

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn api.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Accede a `http://localhost:5173` (Vite dev server) para desarrollo con HMR (hot reload).

### Opción 3: Docker (Producción)

El `Dockerfile` ya está configurado para:
1. Construir el frontend React (`npm run build`)
2. Copiar assets a `backend/api/static/`
3. Servir todo desde FastAPI en puerto 8000

```bash
docker build -t azca .
docker run -p 8000:8000 azca
```

---

## ⚙️ Configuración Avanzada

### Permitir CORS para Assets Estáticos

Si necesitas servir desde un dominio diferente:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Caché de Archivos Estáticos

Para usar NGINX frente a FastAPI (recomendado en producción):

```nginx
# En nginx.conf
location ~ ^/(css|js|images|fonts|assets)/ {
    proxy_pass http://localhost:8000;
    expires 1y;  # Caché por 1 año para assets versionados
    add_header Cache-Control "public, immutable";
}

location / {
    proxy_pass http://localhost:8000;
    expires off;  # Siempre validar index.html
}
```

### Servir Múltiples Rutas

```python
# Si quieres servir API en /api y frontend en /
app.mount("/", StaticFiles(directory="backend/api/static", html=True), name="frontend")

# O servir docs en rutas específicas
@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

---

## ✅ Validación

### Verificar que Está Funcionando:

```bash
# 1. Iniciar la API
python -m uvicorn backend.api.main:app --reload

# 2. En otra terminal, probar endpoints:
curl http://localhost:8000/           # ← Debe retornar index.html
curl http://localhost:8000/health     # ← Debe retornar JSON
curl http://localhost:8000/docs       # ← Documentación Swagger
```

### Logs Esperados:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     📁 Servidor de archivos estáticos montado en C:\...\backend\api\static
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "404 Not Found" en `/` | Verifica que `index.html` existe en `backend/api/static/` |
| Rutas de React devuelven 404 | Asegúrate que `html=True` está configurado |
| Assets no se cargan (CSS, JS) | Verifica rutas relativas en `index.html` (usa `/` no `./`) |
| API endpoints retornan 404 | Asegúrate que endpoints están definidos ANTES de `app.mount()` |
| CORS errors | Configura `CORSMiddleware` ANTES de montar archivos estáticos |

---

## 📚 Referencias

- [FastAPI Static Files Documentation](https://fastapi.tiangolo.com/tutorial/static-files/)
- [Path Parameters & SPAs](https://fastapi.tiangolo.com/tutorial/static-files/#mount-a-staticfiles-application)
- [React Router with FastAPI](https://stackoverflow.com/questions/72566264)

---

## 🎯 Próximos Pasos

1. ✅ **Configuración completada** - FastAPI serviendo archivos estáticos
2. ⏳ **Construir frontend React** - `npm run build`
3. ⏳ **Copiar assets** - Mover build a `backend/api/static/`
4. ⏳ **Probar localmente** - Acceder a http://localhost:8000
5. ⏳ **Desplegar a Azure** - `./azure-deploy.sh`

---

**Fecha de Configuración:** Marzo 15, 2026
**Estado:** ✅ Listo para usar
