# Frontend API Integration - URLs Relativizadas ✅

## Estado: LISTO PARA DOCKER

Toda la integración frontend-API está configurada con **rutas relativas**, lista para funcionar en:
- ✅ Desarrollo local (`npm run dev` + uvicorn)
- ✅ Producción (`npm run build` + FastAPI serving static files)
- ✅ Docker (frontend + backend en mismo container)

---

## 📍 Rutas Relativas Utilizadas

Todas las llamadas API usan rutas relativas (empiezan con `/`):

### Autenticación
```typescript
// authService.ts
POST /auth/login                    # Iniciar sesión
GET  /auth/me                       # Obtener sesión actual
PATCH /restaurants/{id}/image       # Actualizar imagen restaurante
```

### Restaurantes
```typescript
// useRestaurants.ts, MenuView.tsx
GET /restaurants                    # Listar todos
GET /restaurants/{id}               # Detalles de uno específico
```

### Predicciones
```typescript
// MenuView.tsx, TestMode.jsx
POST /predict                       # Predicción de servicios
POST /predict/starter               # Predicción starter (entrada)
POST /predict/main                  # Predicción main (principal)
POST /predict/dessert               # Predicción dessert (postre)
```

### Inscripciones
```typescript
// inscripcionesService.ts
GET    /inscripciones               # Listar todas
GET    /inscripciones?status=...    # Filtrar por estado
GET    /inscripciones/pending       # Obtener pendientes
POST   /inscripciones               # Crear nueva
POST   /inscripciones/{id}/approve  # Aprobar
POST   /inscripciones/{id}/reject   # Rechazar
DELETE /inscripciones/history/approved  # Limpiar historial
```

---

## 🛠️ Arquitectura de Desarrollo

### Modo: `npm run dev` (Desarrollo Local)

```
Frontend (port 5173)            Backend (port 8000)
    ↓                                  ↓
    + Vite dev server                 + Uvicorn
    + Fast refresh                 + Hot reload
    + Proxy en vite.config.js         + SQLAlchemy
      └─> http://127.0.0.1:8000
```

**Configuración (vite.config.js):**
```javascript
const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

server: {
  proxy: {
    '/predict': { target: apiTarget, changeOrigin: true },
    '/health': { target: apiTarget, changeOrigin: true },
    '/restaurants': { target: apiTarget, changeOrigin: true },
    '/inscripciones': { target: apiTarget, changeOrigin: true },
    '/auth': { target: apiTarget, changeOrigin: true },
    '/ocr': { target: apiTarget, changeOrigin: true },
  }
}
```

**Cómo funciona:**
1. React hace fetch a `/predict` (ruta relativa)
2. Vite dev server intercepta por el proxy
3. Redirige a `http://127.0.0.1:8000/predict`
4. Backend responde
5. Vite retorna respuesta a React

### Modo: `npm run build` + `uvicorn` (Producción)

```
FastAPI (port 8000)
    │
    ├─ Sirve /api → endpoints Python
    │
    └─ Sirve / → index.html + assets React (static files)
```

**Cómo funciona:**
1. Frontend `npm run build` crea `dist/`
2. Archivos copiados a `backend/api/static/`
3. FastAPI monta `StaticFiles` en `/`
4. Usuario accede a `http://localhost:8000/`
5. Recibe `index.html`
6. React carga con rutas relativas
7. Fetch a `/predict` → FastAPI responde
8. sin proxy, sin problema 🎉

### Modo: Docker (Producción)

```
Docker Image
    │
    ├─ Stage 1: Node.js builder → npm run build
    │
    └─ Stage 2: Python container
        │
        ├─ Copia build de React a backend/api/static/
        │
        └─ Inicia FastAPI en puerto 8000
           └─ Sirve React build
           └─ Responde API requests
```

**URL Base:**
- Desarrollo: `http://localhost:5173` (Vite)
- Local API: `http://localhost:8000` (FastAPI solo)
- Docker: `http://localhost:8000` o `https://yourdomain.com` (FastAPI + React build)

---

## 🔧 Implementación por Archivo

### 1. **frontend/src/services/authService.ts**
```typescript
// ✅ Todas las rutas son relativas
export async function login(email: string, password: string) {
  const response = await fetch('/auth/login', {  // ← Ruta relativa
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', email, password }),
  })
  return parseResponse<AuthSession>(response, 'No se pudo iniciar sesión.')
}
```

### 2. **frontend/src/hooks/useRestaurants.ts**
```typescript
const listResponse = await fetch('/restaurants')  // ← Ruta relativa
const detailResponse = await fetch(`/restaurants/${item.restaurant_id}`)  // ← Ruta relativa
```

### 3. **frontend/src/views/client/MenuView.tsx**
```typescript
const response = await fetch(`/restaurants/${restaurantIdNumber}`)  // ✅
const serviceRes = await fetch('/predict', { method: 'POST', ... })  // ✅
const starterRes = await fetch('/predict/starter', { method: 'POST', ... })  // ✅
```

### 4. **frontend/src/TestMode.jsx**
```typescript
const response = await fetch('/predict', {  // ✅ Ruta relativa
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
```

### 5. **frontend/src/services/inscripcionesService.ts**
```typescript
// ✅ Todas usan rutas relativas
const response = await fetch('/inscripciones/pending')
const response = await fetch(`/inscripciones/${inscripcionId}/approve`, { method: 'POST' })
const response = await fetch('/inscripciones/history/approved', { method: 'DELETE' })
```

---

## 🚀 Flujo Completo: Desarrollo a Producción

### Paso 1: Desarrollo Local
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn api.main:app --reload
# Escuchando en http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm run dev
# Escuchando en http://localhost:5173
# Proxy configurado a http://localhost:8000
```

**Resultado:**
- Acceder a http://localhost:5173/menu
- Vite proxy redirige fetch a http://localhost:8000/restaurants
- React obtiene datos ✅

### Paso 2: Build Producción
```bash
# Frontend
cd frontend
npm run build
# Crea dist/

# Copiar a backend
xcopy "frontend\dist\*" "backend\api\static\" /E /I /Y

# Backend
cd backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
# Escuchando en http://localhost:8000
```

**Acceso:**
- Abrir http://localhost:8000
- FastAPI sirve index.html desde static/
- React carga con rutas relativas
- Fetch a /restaurants → http://localhost:8000/restaurants (mismo server) ✅

### Paso 3: Docker
```dockerfile
# Stage 1: Build React
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/ .
RUN npm ci && npm run build

# Stage 2: Python backend
FROM python:3.10.11-slim
WORKDIR /app
# Copia build de React
COPY --from=frontend-builder /app/dist backend/api/static/
# Copia backend
COPY backend/ backend/
# Inicia FastAPI
CMD ["uvicorn", "backend.api.main:app", ...]
```

**En Docker:**
- Usuario accede a http://contenedor:8000
- FastAPI sirve React desde `backend/api/static/`
- React usa rutas relativas
- Todo funciona en mesmo container ✅

---

## ✅ Checklist: Validación para Docker

- [x] Todos los fetch() usan rutas relativas (`/predict`, `/restaurants`, etc.)
- [x] No hay URLs hardcodeadas a `localhost:8000` o `localhost:8001` en código
- [x] Vite proxy solo usa localhost para desarrollo (no afecta build)
- [x] Backend (main.py) monta StaticFiles en `/`
- [x] Carpeta `backend/api/static/` existe y contiene index.html
- [x] Dockerfile hace build del frontend primero
- [x] Dockerfile copia assets a backend/api/static/
- [x] FastAPI CORS está configurado

### Validación Manual:

```bash
# 1. Build Docker
docker build -t azca .

# 2. Correr container
docker run -p 8000:8000 azca

# 3. Probar
curl http://localhost:8000/                 # Debe retornar HTML
curl http://localhost:8000/health           # Debe retornar JSON
curl http://localhost:8000/restaurants      # Debe retornar JSON
```

---

## 🎯 Variables de Entorno (Producción)

Si necesitas cambiar la API base en producción (ej: API externo):

**En docker-compose.yml o env vars:**
```bash
# Para desarrollo con vite:
VITE_API_BASE_URL=http://mi-api.example.com

# En production, React sigue usando rutas relativas
# El NGINX/reverse proxy redirige a FastAPI
```

**Ejemplo con NGINX reverse proxy:**
```nginx
location /api/ {
    proxy_pass http://backend:8000/;
}

location / {
    proxy_pass http://backend:8000/;  # Sirve React build
}
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después | Estado |
|---------|-------|---------|--------|
| URLs hardcodeadas | localhost:8001 | Rutas relativas | ✅ Completado |
| Funcionamiento local | Manual proxy | Vite proxy auto | ✅ Mejorado |
| Funcionamiento Docker | No soportado | Soportado | ✅ Listo |
| Múltiples ambientes | Necesitas cambiar código | Variables de env | ✅ Flexible |
| Deployments | Difícil | Trivial | ✅ Simple |

---

## 🔍 Arquitectura Visual

```
                    DESARROLLO
        ┌─────────────────────────────┐
        │   http://localhost:5173     │
        │    (Vite React Server)      │
        │  + Fast Refresh HMR         │
        │  + Proxy a :8000            │
        └──────────────┬──────────────┘
                       │ fetch /predict
                       ↓
        ┌─────────────────────────────┐
        │   http://localhost:8000     │
        │    (Uvicorn FastAPI)        │
        │  + Reload en cambios        │
        │  + SQLAlchemy + Azure SQL   │
        └─────────────────────────────┘

                  PRODUCCIÓN
        ┌─────────────────────────────┐
        │   http://localhost:8000     │
        │    (FastAPI Container)      │
        │  ├─ Sirve React build/      │
        │  ├─ Responde /api/*         │
        │  └─ CORS + Security headers │
        └─────────────────────────────┘

                    DOCKER
        ┌──────────────────────────────┐
        │    Docker Container          │
        │  ┌──────────────────────┐    │
        │  │  Node.js Builder     │    │
        │  │  npm run build       │    │
        │  │  → dist/             │    │
        │  └──────────────────────┘    │
        │           ↓                   │
        │  ┌──────────────────────┐    │
        │  │  Python FastAPI      │    │
        │  │  - Copia dist/ aquí  │    │
        │  │  - Monta StaticFiles │    │
        │  │  - Puerto 8000       │    │
        │  └──────────────────────┘    │
        └──────────────────────────────┘
```

---

## 📝 Resumen

✅ **Frontend está 100% optimizado para Docker**

1. Todas las llamadas API usan **rutas relativas**
2. El Vite proxy solo se usa en desarrollo
3. El build de producción mantiene rutas relativas
4. FastAPI ahora sirve los archivos estáticos
5. Sin cambios de código necesarios para Docker/Producción

🚀 **Listo para desplegar:**
```bash
./azure-deploy.sh azcaregistry azcaapi latest
```

---

**Fecha:** Marzo 15, 2026
**Estado:** ✅ COMPLETADO - LISTO PARA DOCKER
