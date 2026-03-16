-- Agregar columna image_data a dim_restaurants para almacenar imágenes en Base64/binario
ALTER TABLE dim_restaurants
ADD image_data VARBINARY(MAX) NULL;

-- Verificar que la columna fue agregada
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'dim_restaurants' AND COLUMN_NAME = 'image_data';
