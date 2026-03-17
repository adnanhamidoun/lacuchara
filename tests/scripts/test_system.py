import requests
import json

print('=' * 60)
print('PRUEBAS COMPLETAS DEL SISTEMA')
print('=' * 60)

# Test 1: Admin Login
print('\n1. LOGIN ADMIN')
print('-' * 60)
response = requests.post('http://localhost:8000/auth/login', json={
    'email': 'admin@cuisineaml.com',
    'password': 'admin123456'
})
if response.status_code == 200:
    data = response.json()
    print(f'✅ Status: {response.status_code}')
    print(f'   Role: {data["role"]}')
    print(f'   Email: {data["email"]}')
else:
    print(f'❌ Error: {response.status_code}')

# Test 2: Restaurant Login
print('\n2. LOGIN RESTAURANTE')
print('-' * 60)
response = requests.post('http://localhost:8000/auth/login', json={
    'email': 'test@restaurante.com',
    'password': 'testpass123'
})
if response.status_code == 200:
    data = response.json()
    print(f'✅ Status: {response.status_code}')
    print(f'   Role: {data["role"]}')
    print(f'   Restaurant ID: {data["restaurant_id"]}')
    print(f'   Restaurant Name: {data["restaurant_name"]}')
else:
    print(f'❌ Error: {response.status_code}')

# Test 3: Get Restaurants
print('\n3. OBTENER LISTA RESTAURANTES')
print('-' * 60)
response = requests.get('http://localhost:8000/restaurants')
if response.status_code == 200:
    data = response.json()
    print(f'✅ Status: {response.status_code}')
    print(f'   Total: {data["count"]} restaurantes')
else:
    print(f'❌ Error')

print('\n' + '=' * 60)
print('FLUJO COMPLETO VINCULADO')
print('=' * 60)
print('''
FLUJO DE REGISTRO Y APROBACIÓN:
1. Restaurante se registra en /restaurante/alta
   - Proporciona email y contraseña
   - Sistema hashea contraseña y crea inscripción pendiente

2. Admin aprueba en /admin/inscripciones
   - Mueve restaurante a dim_restaurants
    - Crea usuario en dbo.users con credenciales hasheadas

3. Restaurante inicia sesión en /login
    - Sistema busca en dbo.users
   - Valida contraseña hasheada
   - Devuelve token con role "restaurant_owner" y restaurant_id

4. Restaurante accede a /restaurante/panel
   - ProtectedRoute valida rol
   - Panel muestra opciones del restaurante
   - Puede actualizar imagen, OCR, etc.

FLUJO ADMIN:
1. Admin inicia sesión en /login
    - Busca en dbo.users con restaurant_id=0
   - Valida contraseña
   - Devuelve token con role "admin"

2. Admin accede a /admin/inscripciones
   - ProtectedRoute valida rol
   - Ve inscripciones pendientes
   - Puede aprobar o rechazar
   - Puede eliminar restaurantes activos
''')
