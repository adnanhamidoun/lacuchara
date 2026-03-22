from backend.db.database import engine
from sqlalchemy import text

# Limpiar datos de prueba
sql = "TRUNCATE TABLE dbo.dish_ratings"

with engine.connect() as conn:
    conn.execute(text(sql))
    conn.commit()
    print("�o. Tabla dish_ratings limpiada")

