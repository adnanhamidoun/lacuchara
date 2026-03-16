#!/usr/bin/env python
"""
Simple server starter - sin problemas en Windows
"""
import sys
import os
import asyncio

# Agregar el path del proyecto
sys.path.insert(0, os.path.dirname(__file__))

# Importar FastAPI directamente y ejecutar
from backend.api.main import app
import uvicorn

async def run_server():
    """Ejecutar servidor con asyncio"""
    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 AZCA Cuisine AML - Servidor Iniciando")
    print("=" * 70)
    print("📍 URL: http://127.0.0.1:8000")
    print("📊 Admin: http://127.0.0.1:8000 (login requerido)")
    print("📝 API Docs: http://127.0.0.1:8000/docs")
    print("=" * 70)
    print()
    
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        print("\n\n✅ Servidor detenido")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
