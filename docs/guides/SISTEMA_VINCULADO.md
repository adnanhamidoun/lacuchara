# 🍽️ CUISINE AML - Sistema Completamente Vinculado

## ✅ Estado Final del Sistema

### 1. **Autenticación Unificada** 
La tabla `dbo.users` es la fuente única de verdad para autenticación:
- **Admin**: `restaurant_id = 0`, role = "admin"
- **Restaurantes**: `restaurant_id > 0`, role = "restaurant_owner"

**Endpoint**: `POST /auth/login`
- Busca en `dbo.users` por `login_email`
- Valida contraseña hasheada con `verify_password()`
- Devuelve token JWT con role, email, restaurant_id

### 2. **Flujo de Registro (Restaurante)**
```
/restaurante/alta (RestaurantOnboardingView.tsx)
  ↓
POST /inscripciones (crea inscripción pendiente)
  - Hashea contraseña con hash_password()
  - Guarda en dbo.inscriptions con estado "pendiente"
  ↓
Admin aprueba desde /admin/inscripciones
  ↓
approve_inscripcion()
  - Crea restaurante en dim_restaurants (SIN credenciales)
  - Crea usuario en dbo.users (CON credenciales)
  - Elimina inscripción
```

### 3. **Flujo de Login**
```
POST /auth/login
├─ Busca usuario en dbo.users
├─ Valida contraseña hasheada
├─ Si restaurant_id == 0:
│  └─ Devuelve token con role="admin"
└─ Si restaurant_id > 0:
   └─ Devuelve token con role="restaurant_owner" + restaurant_id + restaurant_name
   
Token contiene:
{
  "role": "admin" | "restaurant_owner",
  "email": "...",
  "restaurant_id": 0 | N,
  "user_id": N,
  "exp": timestamp
}
```

### 4. **Rutas Protegidas (Frontend)**
```
/login
├─ Acepta email + password
├─ Si role="admin" → redirige a /admin/inscripciones
└─ Si role="restaurant_owner" → redirige a /restaurante/panel

/admin/inscripciones (ProtectedRoute role="admin")
├─ Dashboard Admin
├─ Pestaña "Solicitudes Pendientes"
├─ Pestaña "Restaurantes Activos" (con botón eliminar)
└─ Pestaña "Historial de Operaciones"

/restaurante/panel (ProtectedRoute role="restaurant_owner")
├─ Panel del Restaurante
├─ Actualizar imagen
└─ OCR de menú
```

### 5. **Navbar Dinámico (MainLayout.jsx)**
```
Si NO autenticado:
├─ "Iniciar Sesión" → /login
└─ "Únete como Restaurante" → /restaurante/alta

Si autenticado como ADMIN:
├─ "Dashboard Admin" → /admin/inscripciones
└─ "Cerrar Sesión"

Si autenticado como RESTAURANTE:
├─ "Mi Restaurante" → /restaurante/panel
└─ "Cerrar Sesión"
```

### 6. **Endpoints Implementados**

#### Autenticación
```
POST /auth/login
POST /auth/me (verificar sesión)
```

#### Restaurantes
```
GET /restaurants (lista con imagen, capacidad, cocina)
GET /restaurants/{id} (detalle completo)
PATCH /restaurants/{id}/image (admin)
DELETE /restaurants/{id} (admin)
```

#### Inscripciones
```
POST /inscripciones (crear solicitud)
GET /inscripciones (todas)
GET /inscripciones/pending (pendientes)
POST /inscripciones/{id}/approve (admin)
POST /inscripciones/{id}/reject (admin)
```

## 🧪 Pruebas Ejecutadas

```
✅ Admin Login: 200 OK
✅ Restaurant Login: 200 OK
✅ Get Restaurants: 200 OK (21 restaurantes)
```

## 📝 Estructura de Tablas

### dbo.users (Fuente de Autenticación)
```
- user_id (PK)
- restaurant_id (0 = admin, >0 = restaurante)
- login_email (unique)
- password_hash (bcrypt hasheada)
- created_at
- is_active
- role ('admin' | 'restaurant_owner')
```

### dbo.dim_restaurants
```
- restaurant_id (PK)
- name
- capacity_limit
- cuisine_type
- image_url
- ... (otros datos de predicción)
```

### dbo.inscriptions (Solicitudes Pendientes)
```
- inscripcion_id (PK)
- name
- login_email
- password_hash (será copiada a Users al aprobar)
- estado_inscripcion ('pendiente'|'aprobada'|'rechazada')
- ... (otros datos del restaurante)
```

## 🔐 Seguridad

1. **Contraseñas**: Siempre hasheadas con bcrypt
2. **Tokens JWT**: Incluyen rol y datos relevantes
3. **ProtectedRoute**: Valida rol antes de acceso
4. **Admin-only**: Endpoints de DELETE y approve usan validación de role

## 🚀 Próximos Pasos (Opcional)

1. Implementar refresh tokens
2. Agregar 2FA para admin
3. Registros de auditoría para DELETE
4. Notificaciones por email
5. Dashboard de estadísticas para restaurantes
