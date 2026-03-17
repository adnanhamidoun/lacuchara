-- Creación de la tabla de auditoría de predicciones
CREATE TABLE PredictionLogs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    execution_timestamp DATETIME2 DEFAULT GETDATE(), -- Cuándo se consultó
    service_date DATE NOT NULL,                      -- Día predicho
    max_temp_c FLOAT,                                -- Input: Temperatura
    precipitation_mm FLOAT,                          -- Input: Lluvia
    is_stadium_event BIT,                            -- Input: Fútbol
    is_payday_week BIT,                              -- Input: Cobro
    prediction_result INT NOT NULL,                  -- Resultado IA
    model_version VARCHAR(50) DEFAULT 'v1_xgboost',  -- Versión
    full_input_json NVARCHAR(MAX)                    -- Backup total
);

-- Índice para que la App cargue rápido el historial
CREATE INDEX idx_service_date ON PredictionLogs(service_date);

-- Tabla de Menús del Día (Subidos por OCR/Manual)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[daily_menus]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.daily_menus (
        menu_id INT IDENTITY(1,1) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        starter NVARCHAR(MAX),
        main NVARCHAR(MAX),
        dessert NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Tabla de Usuarios (Autenticación de Restaurantes)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        login_email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1,
        role VARCHAR(50) DEFAULT 'restaurant_owner'
    );
END
GO

-- Tabla de Valoraciones de Platos (Nueva, para rankings y gestión dedicada)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dish_ratings]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.dish_ratings (
        rating_id INT IDENTITY(1,1) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        rating_date DATE NOT NULL,
        dish_name VARCHAR(500) NOT NULL,
        dish_key VARCHAR(500) NOT NULL,
        rating FLOAT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        menu_id INT NULL,
        dish_id INT NULL
    );
END
GO

-- Migración (si la tabla ya existe): quitar cualquier rastro de "usuarios" en valoraciones
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dish_ratings]') AND type in (N'U'))
BEGIN
    -- Si existía un índice único por reviewer, eliminarlo
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_dish_ratings_reviewer' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
        DROP INDEX UX_dish_ratings_reviewer ON dbo.dish_ratings;

    -- Si existía la columna reviewer_name, eliminarla
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'reviewer_name'
    )
        ALTER TABLE dbo.dish_ratings DROP COLUMN reviewer_name;

    -- ✅ Eliminar rater_id (no hace falta ser usuario para valorar)
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'rater_id'
    )
        ALTER TABLE dbo.dish_ratings DROP COLUMN rater_id;

    -- Asegurar columnas esperadas (si la tabla venía de versiones anteriores)
    IF COL_LENGTH('dbo.dish_ratings', 'rating_date') IS NULL
        ALTER TABLE dbo.dish_ratings ADD rating_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE);

    IF COL_LENGTH('dbo.dish_ratings', 'dish_name') IS NULL
        ALTER TABLE dbo.dish_ratings ADD dish_name VARCHAR(500) NOT NULL DEFAULT '';

    IF COL_LENGTH('dbo.dish_ratings', 'dish_key') IS NULL
        ALTER TABLE dbo.dish_ratings ADD dish_key VARCHAR(500) NOT NULL DEFAULT '';

    IF COL_LENGTH('dbo.dish_ratings', 'rating') IS NULL
        ALTER TABLE dbo.dish_ratings ADD rating FLOAT NOT NULL DEFAULT (0);
    
    -- ✅ Convertir rating de INT a FLOAT si aún es INT
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'dish_ratings' AND COLUMN_NAME = 'rating' AND DATA_TYPE = 'int'
    )
    BEGIN
        ALTER TABLE dbo.dish_ratings ALTER COLUMN rating FLOAT NOT NULL;
    END

    -- Asegurar columnas esperadas (si la tabla venía de versiones anteriores)
    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'menu_id'
    )
        ALTER TABLE dbo.dish_ratings ADD menu_id INT NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'dish_id'
    )
        ALTER TABLE dbo.dish_ratings ADD dish_id INT NULL;
END
GO

-- Índices para búsquedas y rankings
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_restaurant' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_restaurant ON dbo.dish_ratings(restaurant_id);
GO
IF COL_LENGTH('dbo.dish_ratings', 'menu_id') IS NOT NULL
AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_menu' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_menu ON dbo.dish_ratings(menu_id);
GO
IF COL_LENGTH('dbo.dish_ratings', 'dish_id') IS NOT NULL
AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_dish' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_dish ON dbo.dish_ratings(dish_id);
GO
IF COL_LENGTH('dbo.dish_ratings', 'rating_date') IS NOT NULL
AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_rating_date' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_rating_date ON dbo.dish_ratings(rating_date);
GO
IF COL_LENGTH('dbo.dish_ratings', 'dish_key') IS NOT NULL
AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_dish_key' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_dish_key ON dbo.dish_ratings(dish_key);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_dish_ratings_created_at' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
    CREATE INDEX IX_dish_ratings_created_at ON dbo.dish_ratings(created_at);
GO