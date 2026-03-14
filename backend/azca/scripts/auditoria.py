import pandas as pd

df = pd.read_csv('dataset_entrenamiento_menus_v2.csv')

def realizar_auditoria(df):
    print("🔍 INICIANDO AUDITORÍA DEL VIGARDO 2.0...\n")
    
    # 1. Test de la Paella (Jueves + Spanish)
    paellas_jueves = df[(df['day_of_week'] == 3) & (df['cuisine_type'] == 'Spanish')]
    solo_paella = paellas_jueves[paellas_jueves['first_course'] == 'Paella Valenciana']
    ratio_paella = len(solo_paella) / len(paellas_jueves) if len(paellas_jueves) > 0 else 0
    print(f"🥘 Ratio de Paella los Jueves: {ratio_paella:.2%}")

    # 2. Test del Calor (Temp > 25ºC y platos calientes)
    platos_calientes = ['Lentejas estofadas', 'Sopa castellana', 'Potaje de garbanzos', 'Minestrone', 'Sopa de pescado']
    dias_calor = df[df['max_temp_c'] > 25]
    errores_calor = dias_calor[dias_calor['first_course'].isin(platos_calientes)]
    ratio_error_calor = len(errores_calor) / len(dias_calor) if len(dias_calor) > 0 else 0
    print(f"🔥 'Crimen': Platos calientes con calor (>25ºC): {ratio_error_calor:.2%}")

    # 3. Test de Identidad (¿Se respetan las cocinas?)
    # Miramos si un italiano sirve algo que NO está en su config (ej. Lentejas)
    errores_identidad = df[(df['cuisine_type'] == 'Italian') & (df['first_course'] == 'Lentejas estofadas')]
    print(f"🤌 'Crimen': Italianos sirviendo Lentejas: {len(errores_identidad)} casos")

    # 4. Muestra aleatoria de 5 filas para inspección ocular
    print("\n👀 MUESTRA DE CONTROL (10 filas aleatorias):")
    cols_check = ['service_date', 'max_temp_c', 'cuisine_type', 'first_course', 'second_course', 'dessert']
    print(df[cols_check].sample(10).to_string(index=False))

realizar_auditoria(df)