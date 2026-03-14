import pandas as pd
import numpy as np
import random
import os

# 1. Cargar el suelo del proyecto
archivo_entrada = 'base_azca.csv'
if not os.path.exists(archivo_entrada):
    print(f"❌ Error: No encuentro el archivo '{archivo_entrada}' en {os.getcwd()}")
    exit()

df = pd.read_csv(archivo_entrada)
print(f"✅ Archivo cargado: {len(df)} filas encontradas.")

# 2. Definimos la base de datos de platos
menus_config = {
    'Spanish': {
        'first': {
            'warm': ['Lentejas estofadas', 'Sopa castellana', 'Crema de verduras', 'Potaje de garbanzos'],
            'cold': ['Gazpacho', 'Salmorejo', 'Ensalada mixta', 'Pisto manchego'],
            'thursday': 'Paella Valenciana'
        },
        'second': ['Carrilleras al vino', 'Merluza a la romana', 'Tortilla de patata', 'Filete de ternera'],
        'dessert': ['Natillas', 'Arroz con leche', 'Fruta', 'Flan']
    },
    'Italian': {
        'first': {
            'warm': ['Minestrone', 'Ravioli boloñesa', 'Sopa de tomate', 'Tortellini nata'],
            'cold': ['Ensalada Caprese', 'Carpaccio', 'Ensalada de pasta', 'Bruschettas'],
        },
        'second': ['Lasagna', 'Escalope Milanese', 'Risotto de setas', 'Pizza Margarita'],
        'dessert': ['Tiramisú', 'Panna Cotta', 'Gelato', 'Profiteroles']
    },
    'Mediterranean': {
        'first': {
            'warm': ['Crema de calabacín', 'Sopa de marisco', 'Berenjena rellena', 'Falafel'],
            'cold': ['Hummus', 'Ensalada Griega', 'Tabulé', 'Escalivada'],
        },
        'second': ['Salmón plancha', 'Pollo al horno', 'Lubina', 'Brochetas de pavo'],
        'dessert': ['Yogur con miel', 'Fruta', 'Sorbete', 'Macedonia']
    },
    'Grill': {
        'first': {
            'warm': ['Sopa de cebolla', 'Alitas BBQ', 'Nachos con queso', 'Champiñones'],
            'cold': ['Coleslaw', 'Ensalada César', 'Ceviche', 'Tosta de aguacate'],
        },
        'second': ['Entrecot', 'Hamburguesa Gourmet', 'Costillas BBQ', 'Secreto Ibérico'],
        'dessert': ['Brownie', 'Cheesecake', 'Tarta de manzana', 'Batido']
    }
}

# --- Limpieza de datos (Evita errores de "Grill " vs "Grill") ---
df['cuisine_type'] = df['cuisine_type'].str.strip()

# --- GENERADOR DE PERSONALIDADES ---
print("👨‍🍳 Configurando personalidades de los chefs...")
restaurant_ids = df['restaurant_id'].unique()
personalidades = {}

for rid in restaurant_ids:
    tipo = df[df['restaurant_id'] == rid]['cuisine_type'].iloc[0]
    # Asegurarnos de que el tipo existe en nuestro diccionario
    if tipo not in menus_config:
        print(f"⚠️ Warning: El tipo '{tipo}' no está en menus_config. Usando 'Spanish' por defecto.")
        tipo = 'Spanish'
        
    posibles_primeros = menus_config[tipo]['first']['warm'] + menus_config[tipo]['first']['cold']
    personalidades[rid] = {
        'fav_first': random.choice(posibles_primeros),
        'fav_second': random.choice(menus_config[tipo]['second']),
        'fav_dessert': random.choice(menus_config[tipo]['dessert'])
    }

def asignar_menu_v2(row):
    try:
        rid = row['restaurant_id']
        cuisine = row['cuisine_type']
        if cuisine not in menus_config: cuisine = 'Spanish' # Fallback
        
        temp = row['max_temp_c']
        day = row['day_of_week']
        clima_tag = 'cold' if temp > 22 else 'warm'
        chef = personalidades[rid]
        
        # Primero
        if cuisine == 'Spanish' and day == 3:
            primero = "Paella Valenciana"
        else:
            es_frio_fav = chef['fav_first'] in menus_config[cuisine]['first']['cold']
            es_caliente_fav = chef['fav_first'] in menus_config[cuisine]['first']['warm']
            
            if ((clima_tag == 'cold' and es_frio_fav) or (clima_tag == 'warm' and es_caliente_fav)) and random.random() < 0.6:
                primero = chef['fav_first']
            else:
                primero = random.choice(menus_config[cuisine]['first'][clima_tag])
        
        # Segundo y Postre
        segundo = chef['fav_second'] if random.random() < 0.6 else random.choice(menus_config[cuisine]['second'])
        postre = chef['fav_dessert'] if random.random() < 0.6 else random.choice(menus_config[cuisine]['dessert'])
        
        return primero, segundo, postre
    except Exception as e:
        return "Error", "Error", "Error"

# 3. Ejecutar la "Cocina de Datos"
print("🍳 Generando histórico (esto puede tardar unos segundos)...")
# Usamos una forma más visual de ver el progreso
resultados = df.apply(asignar_menu_v2, axis=1)
df[['first_course', 'second_course', 'dessert']] = pd.DataFrame(resultados.tolist(), index=df.index)

# 4. Guardar
df.to_csv('dataset_entrenamiento_menus_v2.csv', index=False)
print("🚀 ¡Vigardo de Dataset V2 completado!")
print(f"📁 Archivo guardado como: dataset_entrenamiento_menus_v2.csv")