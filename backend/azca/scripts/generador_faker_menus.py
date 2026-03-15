import pandas as pd
import numpy as np
import random
import os

# 1. Cargar el suelo del proyecto
archivo_entrada = 'base_azca.csv'
if not os.path.exists(archivo_entrada):
    print(f"❌ Error: No encuentro '{archivo_entrada}'")
    exit()

df_base = pd.read_csv(archivo_entrada)

# 2. Configuración de platos
menus_config = {
    'Spanish': {
        'first': {
            'warm': ['Lentejas estofadas', 'Sopa castellana', 'Crema de verduras', 'Potaje de garbanzos', 'Cocido Madrileño'],
            'cold': ['Gazpacho', 'Salmorejo', 'Ensalada mixta', 'Pisto manchego', 'Ensaladilla Rusa'],
            'thursday': 'Paella Valenciana'
        },
        'second': ['Carrilleras al vino', 'Merluza a la romana', 'Tortilla de patata', 'Filete de ternera', 'Cachopo'],
        'dessert': ['Natillas', 'Arroz con leche', 'Fruta', 'Flan', 'Cuajada']
    },
    'Italian': {
        'first': {
            'warm': ['Minestrone', 'Ravioli boloñesa', 'Sopa de tomate', 'Tortellini nata', 'Gnocchi'],
            'cold': ['Ensalada Caprese', 'Carpaccio', 'Ensalada de pasta', 'Bruschettas'],
        },
        'second': ['Lasagna', 'Escalope Milanese', 'Risotto de setas', 'Pizza Margarita', 'Ossobuco'],
        'dessert': ['Tiramisú', 'Panna Cotta', 'Gelato', 'Profiteroles']
    },
    'Mediterranean': {
        'first': {
            'warm': ['Crema de calabacín', 'Sopa de marisco', 'Berenjena rellena', 'Falafel'],
            'cold': ['Hummus', 'Ensalada Griega', 'Tabulé', 'Escalivada'],
        },
        'second': ['Salmón plancha', 'Pollo al horno', 'Lubina', 'Brochetas de pavo', 'Moussaka'],
        'dessert': ['Yogur con miel', 'Fruta', 'Sorbete', 'Macedonia']
    },
    'Grill': {
        'first': {
            'warm': ['Sopa de cebolla', 'Alitas BBQ', 'Nachos con queso', 'Champiñones', 'Aros de cebolla'],
            'cold': ['Coleslaw', 'Ensalada César', 'Ceviche', 'Tosta de aguacate'],
        },
        'second': ['Entrecot', 'Hamburguesa Gourmet', 'Costillas BBQ', 'Secreto Ibérico', 'T-Bone'],
        'dessert': ['Brownie', 'Cheesecake', 'Tarta de manzana', 'Batido']
    }
}

# Listas temporales
headers = [] 
items_raw = [] # Aquí guardaremos temporalmente nombres para luego normalizar
menu_id_counter = 1

print("👨‍🍳 Generando cartas variadas y normalizando platos...")

for index, row in df_base.iterrows():
    rid = row['restaurant_id']
    cuisine = row['cuisine_type'].strip()
    if cuisine not in menus_config: cuisine = 'Spanish'
    
    temp = row['max_temp_c']
    clima_tag = 'cold' if temp > 22 else 'warm'
    
    # 1. CABECERA
    headers.append({
        'menu_id': menu_id_counter,
        'date_id': row['date_id'],
        'restaurant_id': rid
    })
    
    # 2. GENERAR PLATOS (Guardando nombres por ahora)
    # --- Primeros ---
    pool_first = menus_config[cuisine]['first'][clima_tag]
    seleccion_first = random.sample(pool_first, k=random.randint(2, 3))
    if cuisine == 'Spanish' and row['day_of_week'] == 3:
        if "Paella Valenciana" not in seleccion_first: seleccion_first[0] = "Paella Valenciana"
    
    for p in seleccion_first:
        items_raw.append({'menu_id': menu_id_counter, 'course_type': 'first_course', 'dish_name': p})

    # --- Segundos ---
    pool_second = menus_config[cuisine]['second']
    seleccion_second = random.sample(pool_second, k=random.randint(1, 2))
    for p in seleccion_second:
        items_raw.append({'menu_id': menu_id_counter, 'course_type': 'second_course', 'dish_name': p})

    # --- Postres ---
    pool_dessert = menus_config[cuisine]['dessert']
    seleccion_dessert = random.sample(pool_dessert, k=random.randint(1, 2))
    for p in seleccion_dessert:
        items_raw.append({'menu_id': menu_id_counter, 'course_type': 'dessert', 'dish_name': p})

    menu_id_counter += 1

# --- PROCESO DE NORMALIZACIÓN (DESACOPLAMIENTO) ---
df_headers = pd.DataFrame(headers)
df_items_temp = pd.DataFrame(items_raw)

# A. Crear Catálogo Maestro (dim_dishes)
# Sacamos los platos únicos (nombre + tipo)
df_dishes = df_items_temp[['course_type', 'dish_name']].drop_duplicates().reset_index(drop=True)
df_dishes.insert(0, 'dish_id', range(1, len(df_dishes) + 1))

# B. Crear Tabla de Hechos (fact_menu_items)
# Sustituimos el nombre y tipo por el dish_id
df_fact_items = df_items_temp.merge(df_dishes, on=['course_type', 'dish_name'])
df_fact_items = df_fact_items[['menu_id', 'dish_id']] # Solo los IDs

# 4. Guardar los 3 archivos
df_headers.to_csv('fact_menus.csv', index=False)
df_dishes.to_csv('dim_dishes.csv', index=False)
df_fact_items.to_csv('fact_menu_items.csv', index=False)

print(f"✅ ¡Todo listo! Se han generado 3 archivos:")
print(f"   1. fact_menus.csv ({len(df_headers)} filas)")
print(f"   2. dim_dishes.csv ({len(df_dishes)} platos únicos)")
print(f"   3. fact_menu_items.csv ({len(df_fact_items)} relaciones)")