-- Create prediction audit table
CREATE TABLE PredictionLogs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    execution_timestamp DATETIME2 DEFAULT GETDATE(), -- Request timestamp
    service_date DATE NOT NULL,                      -- Predicted service date
    max_temp_c FLOAT,                                -- Input: temperature
    precipitation_mm FLOAT,                          -- Input: rain
    is_stadium_event BIT,                            -- Input: football match
    is_payday_week BIT,                              -- Input: payday week
    prediction_result INT NOT NULL,                  -- AI result
    model_version VARCHAR(50) DEFAULT 'v1_xgboost',  -- Version
    full_input_json NVARCHAR(MAX)                    -- Full payload backup
);

-- Index to speed up history lookups
CREATE INDEX idx_service_date ON PredictionLogs(service_date);

-- Daily menus table (uploaded by OCR/manual flow)
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

-- Users table (restaurant authentication)
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

-- Dish ratings table (ranking and dedicated management)
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

-- Migration (if table already exists): remove any legacy reviewer/user traces
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[dish_ratings]') AND type in (N'U'))
BEGIN
    -- Drop legacy reviewer unique index if present
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_dish_ratings_reviewer' AND object_id = OBJECT_ID(N'dbo.dish_ratings'))
        DROP INDEX UX_dish_ratings_reviewer ON dbo.dish_ratings;

    -- Drop legacy reviewer_name column if present
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'reviewer_name'
    )
        ALTER TABLE dbo.dish_ratings DROP COLUMN reviewer_name;

    -- Drop legacy rater_id (ratings are anonymous)
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.dish_ratings') AND name = 'rater_id'
    )
        ALTER TABLE dbo.dish_ratings DROP COLUMN rater_id;

    -- Ensure expected columns exist (older schema compatibility)
    IF COL_LENGTH('dbo.dish_ratings', 'rating_date') IS NULL
        ALTER TABLE dbo.dish_ratings ADD rating_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE);

    IF COL_LENGTH('dbo.dish_ratings', 'dish_name') IS NULL
        ALTER TABLE dbo.dish_ratings ADD dish_name VARCHAR(500) NOT NULL DEFAULT '';

    IF COL_LENGTH('dbo.dish_ratings', 'dish_key') IS NULL
        ALTER TABLE dbo.dish_ratings ADD dish_key VARCHAR(500) NOT NULL DEFAULT '';

    IF COL_LENGTH('dbo.dish_ratings', 'rating') IS NULL
        ALTER TABLE dbo.dish_ratings ADD rating FLOAT NOT NULL DEFAULT (0);
    
    -- Convert rating from INT to FLOAT when needed
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'dish_ratings' AND COLUMN_NAME = 'rating' AND DATA_TYPE = 'int'
    )
    BEGIN
        ALTER TABLE dbo.dish_ratings ALTER COLUMN rating FLOAT NOT NULL;
    END

    -- Ensure expected foreign-key columns exist
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

-- Indexes for queries and rankings
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

