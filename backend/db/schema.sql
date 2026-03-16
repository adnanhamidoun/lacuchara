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
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.Users (
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