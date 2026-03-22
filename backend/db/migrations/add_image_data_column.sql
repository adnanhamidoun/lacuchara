-- Add image_data column to dim_restaurants to store Base64/binary images
ALTER TABLE dim_restaurants
ADD image_data VARBINARY(MAX) NULL;

-- Verify que la columna fue agregada
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'dim_restaurants' AND COLUMN_NAME = 'image_data';



