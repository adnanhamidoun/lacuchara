#!/usr/bin/env python
"""
Script de startup robusto para evitar que el servidor se cierre en Windows.
Ejecuta el servidor sin modo reload y con workers explícitos.
"""

import subprocess
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

def run_server():
    """Ejecutar el servidor de forma robusta"""
    print("🚀 Iniciando servidor AZCA...")
    print("=" * 60)
    
    os.chdir(PROJECT_ROOT)
    
    # Comando para ejecutar el servidor
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "backend.api.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--workers", "1"
    ]
    
    print(f"Comando: {' '.join(cmd)}")
    print("=" * 60)
    print()
    
    try:
        # Ejecutar el servidor en el proceso actual
        subprocess.run(cmd, check=False)
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
