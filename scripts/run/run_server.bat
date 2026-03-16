@echo off
REM Script para ejecutar el servidor AZCA en Windows

SETLOCAL ENABLEDELAYEDEXPANSION

set "PROJECT_ROOT=%~dp0..\.."
cd /d "%PROJECT_ROOT%"

echo.
echo ========================================
echo   AZCA Cuisine AML - Servidor
echo ========================================
echo.

REM Activar venv
call .venv\Scripts\activate.bat

echo Iniciando servidor...
echo URL: http://127.0.0.1:8000
echo.
echo Presiona CTRL+C para detener el servidor
echo.

REM Ejecutar servidor sin redirección que lo cierre
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000

echo.
echo Servidor detenido.
pause
