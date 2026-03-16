@echo off
REM Script para iniciar el servidor en Windows

echo.
echo ========================================
echo   AZCA Prediction API - Startup Script
echo ========================================
echo.

set "PROJECT_ROOT=%~dp0..\.."
cd /d "%PROJECT_ROOT%"

REM Activar venv
call .venv\Scripts\activate.bat

REM Iniciar servidor
echo Iniciando servidor en http://127.0.0.1:8000
echo Presiona CTRL+C para detener
echo.

python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --workers 1

pause
