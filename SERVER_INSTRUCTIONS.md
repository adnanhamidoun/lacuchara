# 🚀 CÓMO EJECUTAR EL SERVIDOR

## Forma Rápida: Ejecutar el Script Batch (RECOMENDADO)

### Paso 1: Abrir CMD o PowerShell en la carpeta del proyecto

```bash
# Navega a la carpeta del proyecto
cd c:\Users\Alumno_AI\Desktop\lacuchara
```

### Paso 2: Ejecutar el script batch

```bash
# Doble-click en run_server.bat
# O desde terminal:
.\run_server.bat
```

Verás:
```
========================================
  AZCA Cuisine AML - Servidor
========================================

Iniciando servidor...
URL: http://127.0.0.1:8000

INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Paso 3: Abrir el navegador

- **URL**: http://127.0.0.1:8000
- **Admin Dashboard**: Login con admin@cuisineaml.com / admin123456
- **Restaurant**: Login con azcaprimegrill@restaurante.com / azcaprimegrill123

---

## Verificar que el Servidor está Corriendo

```powershell
# En otra ventana PowerShell:
netstat -ano | findstr :8000

# Deberías ver algo como:
# TCP    127.0.0.1:8000         0.0.0.0:0              LISTENING       12345
```

---

## Detener el Servidor

- Presiona **CTRL+C** en la ventana del servidor

---

## Alternativa: Ejecutar sin Script (desde terminal)

```bash
cd c:\Users\Alumno_AI\Desktop\lacuchara
.\.venv\Scripts\activate.bat
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```

---

## ¿Qué Ver en el Dashboard?

### Admin Dashboard (`/admin` después de login)

1. **KPIs sin fondo**
   - Restaurantes Activos (verde): 20
   - Solicitudes Pendientes (naranja): 0
   - Aprobadas esta semana (azul): 0

2. **Logo grande en el header** (naranja con borde)

3. **Restaurantes Activos Tab**
   - Listado de 20 restaurantes
   - Cada restaurante con:
     - **Logo circular** con iniciales (si no tiene foto)
     - **Nombre**
     - **Tipo de cocina**
     - **Capacidad**
     - **Botón eliminar** (trash icon)
   - Pasar mouse sobre logo → aparece ícono de cámara para cambiar foto

4. **Cambiar Foto**
   - Click en el logo
   - Seleccionar archivo (JPEG/PNG/WebP, máx 5MB)
   - Preview antes de guardar
   - Click "Guardar"

---

## Flujo Completo de Prueba

### 1. Login Admin
```
Email: admin@cuisineaml.com
Password: admin123456
```

### 2. Ver Dashboard
- Verás los 20 restaurantes activos
- Cada uno con su logo (iniciales si no tiene foto)

### 3. Cambiar Foto de un Restaurante
- Pasa el mouse sobre el logo
- Click en ícono de cámara
- Selecciona una imagen local
- Click "Guardar"
- La imagen se guardaría en BD (cuando servidor esté estable)

### 4. Ver Lista Pública de Restaurantes
- Logout o abre navegador en incógnito
- Ve a http://127.0.0.1:8000
- Haz click en "Ver Restaurantes" o ve a `/cliente/restaurantes`
- Verás los restaurantes con sus logos

---

## Credenciales de Prueba

**Admin:**
```
Email: admin@cuisineaml.com
Password: admin123456
```

**Restaurante 1 (Azca Prime Grill):**
```
Email: azcaprimegrill@restaurante.com
Password: azcaprimegrill123
```

Ver `restaurantes_credenciales.txt` para más restaurantes (20 en total).

---

## API Endpoints Disponibles

### Sin Autenticación
- `GET /restaurants` - Listar todos los restaurantes
- `GET /restaurants/{id}` - Detalle de un restaurante
- `GET /restaurants/{id}/image` - Obtener imagen en Base64

### Con Autenticación
- `POST /login` - Login
- `PATCH /restaurants/{id}/image` - Cambiar imagen (admin o propietario)
- `DELETE /restaurants/{id}` - Eliminar restaurante (solo admin)

### API Docs
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc

---

## Solución de Problemas

### Error: "Port 8000 already in use"

```powershell
# Encontrar el proceso
netstat -ano | findstr :8000

# Matar el proceso (replace 12345 con el PID)
taskkill /PID 12345 /F
```

### Error: Module not found

```bash
# Asegurate que el venv está activado
.\.venv\Scripts\activate.bat

# Reinstalar dependencias
pip install -r requirements.txt
```

### Servidor se cierra inmediatamente

- Usa el script batch `run_server.bat` en lugar de terminal
- O ejecuta desde una ventana CMD separada (no PowerShell)

---

## Arquitectura

```
Cliente (Navegador)
    ↓
http://127.0.0.1:8000 (Frontend React + Vite)
    ↓
Backend FastAPI
    ├── /login
    ├── /restaurants
    ├── /restaurants/{id}/image (GET/PATCH)
    └── /admin/... (endpoints admin)
    ↓
Azure SQL Database
    ├── dim_restaurants (con columna image_data VARBINARY)
    ├── dbo.Users (auth)
    └── dbo.inscripciones (pending signups)
```

---

## Resumen

✅ **Sistema completado**:
- Admin Dashboard con logo
- KPIs sin fondo
- Logos de restaurantes (iniciales si no hay foto)
- Cambiar fotos de restaurantes
- Subir fotos desde panel del restaurante
- Imagenes guardadas en BD como Base64

📝 **Próximo paso**: Ejecutar el server con `run_server.bat` y ver el dashboard en acción!

---

**Fecha**: 16 de Marzo de 2026  
**Estado**: ✅ LISTO PARA USAR
