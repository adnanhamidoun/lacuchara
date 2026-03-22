import requests
import json

print('=' * 60)
print('FULL SYSTEM TESTS')
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
    print(f'Status: {response.status_code}')
    print(f'   Role: {data["role"]}')
    print(f'   Email: {data["email"]}')
else:
    print(f'Error: {response.status_code}')

# Test 2: Restaurant Login
print('\n2. RESTAURANT LOGIN')
print('-' * 60)
response = requests.post('http://localhost:8000/auth/login', json={
    'email': 'test@restaurant.com',
    'password': 'testpass123'
})
if response.status_code == 200:
    data = response.json()
    print(f'Status: {response.status_code}')
    print(f'   Role: {data["role"]}')
    print(f'   Restaurant ID: {data["restaurant_id"]}')
    print(f'   Restaurant Name: {data["restaurant_name"]}')
else:
    print(f'Error: {response.status_code}')

# Test 3: Get restaurants
print('\n3. GET RESTAURANT LIST')
print('-' * 60)
response = requests.get('http://localhost:8000/restaurants')
if response.status_code == 200:
    data = response.json()
    print(f'Status: {response.status_code}')
    print(f'   Total: {data["count"]} restaurants')
else:
    print('Error')

print('\n' + '=' * 60)
print('FULL LINKED FLOW')
print('=' * 60)
print('''
SIGNUP AND APPROVAL FLOW:
1. Restaurant se registra en /restaurant/alta
   - Provides email and password
    - System hashes password and creates a pending registration

2. Admin tests /admin/inscripciones
    - Moves restaurant into dim_restaurants
    - Creates user in dbo.users with hashed credentials

3. Restaurant signs in at /login
    - System queries dbo.users
    - Validates hashed password
    - Returns token with role "restaurant_owner" and restaurant_id

4. Restaurant accesses /restaurant/panel
   - ProtectedRoute valida rol
    - Panel shows restaurant options
    - Can update image, OCR, etc.

ADMIN FLOW:
1. Admin signs in at /login
    - Queries dbo.users with restaurant_id=0
    - Validates password
    - Returns token with role "admin"

2. Admin accede a /admin/inscripciones
   - ProtectedRoute valida rol
    - Reviews pending registrations
    - Can approve or reject
    - Can delete active restaurants
''')




