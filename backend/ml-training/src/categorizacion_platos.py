import pandas as pd
import os

def categorizar_dish(nombre_dish):
    nombre = str(nombre_dish).lower()
    
    # 1. DESSERTS (checked first to avoid ambiguity)
    if any(word in nombre for word in ['tarta', 'helado', 'flan', 'fruta', 'yogur', 'brownie', 'cannoli', 'cuajada', 'baklava', 'coulant', 'affogato', 'mousse', 'semifreddo']):
        return 'Postre'

    # 2. MAIN PROTEIN (Pescados y Carnes mandan sobre el resto de ingredientes)
    elif any(word in nombre for word in ['merluza', 'salmón', 'bacalao', 'dorada', 'lubina', 'boquerones']):
        return 'Pescado'
    elif any(word in nombre for word in ['pollo', 'ternera', 'cerdo', 'hamburguesa', 'chuletas', 'rabo', 'secreto', 'callos', 'ossobuco', 'burger']):
        return 'Carne'
        
    # 3. HIDRATOS PRINCIPALES (Pasta y Arroz)
    # This captures "Macarrones con tomate" because 'macarrones' is detected earlier.
    elif any(word in nombre for word in ['macarrones', 'espaguetis', 'pasta', 'gnocchi', 'fideos']):
        return 'Pasta'
    elif any(word in nombre for word in ['arroz', 'paella', 'risotto']):
        return 'Arroces'
        
    # 4. CUCHARA (Guisos y Sopas)
    elif any(word in nombre for word in ['sopa', 'crema', 'puré', 'cocido', 'fabada', 'lentejas']):
        return 'Cuchara'
        
    # 5. TAPAS, FRIED ITEMS, AND STARTERS (for first-course dishes)
    elif any(word in nombre for word in ['croquetas', 'alitas', 'nachos', 'gambas', 'bruschetta', 'supplì', 'focaccia', 'provoleta']):
        return 'Tapas y Fritos'
        
    # 6. SALADS (remove standalone "tomate" and use more specific words)
    elif any(word in nombre for word in ['ensalada', 'ensaladilla', 'caprese', 'rúcula', 'burrata', 'tzatziki']):
        return 'Ensaladas y Frescos'
        
    # 7. CAJ�"N DESASTRE (Si no encuentra ninguna palabra clave)
    else:
        return 'Otros'

# Load data, apply the function, and save
directorio_actual = os.path.dirname(os.path.abspath(__file__))
ruta_entrada = os.path.abspath(os.path.join(directorio_actual, '../../../csv/menu_history_advanced_features.csv'))
df = pd.read_csv(ruta_entrada)

df['category_starter'] = df['menu_starter'].apply(categorizar_dish)
df['category_main'] = df['menu_main'].apply(categorizar_dish)
df['category_dessert'] = df['menu_dessert'].apply(categorizar_dish)

ruta_salida = os.path.abspath(os.path.join(directorio_actual, '../../../csv/menu_history_categorized.csv'))
df.to_csv(ruta_salida, index=False)

print("Categorization completed with the new hierarchy. File saved.")


