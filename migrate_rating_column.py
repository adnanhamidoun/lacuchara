from backend.db.database import engine
from sqlalchemy import text

sql = """
    -- ✅ Convertir rating de INT a FLOAT
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'dish_ratings' AND COLUMN_NAME = 'rating' AND DATA_TYPE = 'int'
    )
    BEGIN
        ALTER TABLE dbo.dish_ratings ALTER COLUMN rating FLOAT NOT NULL;
        PRINT 'Columna rating convertida a FLOAT';
    END
    ELSE
    BEGIN
        PRINT 'Columna rating ya es FLOAT';
    END
"""

with engine.connect() as conn:
    result = conn.execute(text(sql))
    print("✅ Migración aplicada exitosamente")
    conn.commit()
