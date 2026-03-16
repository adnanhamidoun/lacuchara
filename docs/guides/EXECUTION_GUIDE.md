# 🚀 Guía de Ejecución - AZCA Cuisine AML

## Problema Conocido en Windows

En Windows, el servidor se cierra automáticamente después de unos segundos debido a un conflicto con la librería `azureml` (bug de `_Win32Helper.__del__`).

## Soluciones Recomendadas

### **Opción 1: Docker (RECOMENDADO)**

```bash
# Crear imagen
docker build -t azca-api .

# Ejecutar contenedor
docker run -p 8000:8000 azca-api
```

El servidor correrá perfectamente en Linux dentro del contenedor.

### **Opción 2: WSL2 (Windows Subsystem for Linux)**

```bash
# Instalar WSL2
wsl --install

# Dentro de WSL2:
cd /mnt/c/Users/Alumno_AI/Desktop/lacuchara
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000
```

El servidor funcionará correctamente en WSL2.

### **Opción 3: Linux Remoto o VM**

- Usar una VM con Linux (VirtualBox, Hyper-V, etc.)
- O desplegar en servidor Linux remoto (AWS, Azure, DigitalOcean, etc.)

### **Opción 4: Script con Reintentos (Temporal)**

```bash
cd c:\Users\Alumno_AI\Desktop\lacuchara
python -c "
import subprocess
import time
import sys

max_retries = 5
for attempt in range(max_retries):
    print(f'Intento {attempt + 1}/{max_retries}...')
    subprocess.run([
        sys.executable, '-m', 'uvicorn',
        'backend.api.main:app',
        '--host', '127.0.0.1',
        '--port', '8000'
    ])
    time.sleep(2)
"
```

## API Endpoints Disponibles

### Imágenes de Restaurantes
- `GET /restaurants/{id}/image` - Obtener imagen en Base64
- `PATCH /restaurants/{id}/image` - Subir/cambiar imagen (requiere token admin o propietario)

### Restaurantes
- `GET /restaurants` - Listar todos
- `GET /restaurants/{id}` - Detalle de restaurante
- `DELETE /restaurants/{id}` - Eliminar (solo admin)

### Autenticación
- `POST /login` - Iniciar sesión (admin o restaurante)

### Admin
- `GET /inscripciones` - Ver solicitudes pendientes
- `POST /approve-inscripcion/{id}` - Aprobar restaurante
- `POST /reject-inscripcion/{id}` - Rechazar restaurante

## Frontend

Compilar y ver cambios en tiempo real:

```bash
cd frontend
npm run dev
```

Compilar para producción:

```bash
npm run build
```

## Credenciales de Prueba

**Admin:**
- Email: `admin@cuisineaml.com`
- Password: `admin123456`

**Restaurante (Azca Prime Grill):**
- Email: `azcaprimegrill@restaurante.com`
- Password: `azcaprimegrill123`

Ver `restaurantes_credenciales.txt` para más restaurantes.

## Verificar Funcionamiento

```bash
# Test de imágenes
curl http://localhost:8000/restaurants/1/image

# Test de lista de restaurantes
curl http://localhost:8000/restaurants

# Test de login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cuisineaml.com","password":"admin123456"}'
```

## Notas

- Las fotos se guardan en BD como Base64 (VARBINARY)
- El modelo ML se carga lazy (bajo demanda)
- Cache en memoria se inicializa lazy
- Todos los cambios están implementados y compilados
