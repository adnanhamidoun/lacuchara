#!/usr/bin/env python
"""Test script para los endpoints de imagen Base64"""

import requests
import base64
import sys
import os
from pathlib import Path

# URLs
BASE_URL = "http://localhost:8000"
RESTAURANT_ID = 1

# Token de admin (puede ser cualquier token válido)
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwicmVzdGF1cmFudF9pZCI6MCwiaWF0IjoxNjk5NDIwODAwfQ.test"

# Token de restaurante
RESTAURANT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF6Y2FwcmltZWdyaWxsIiwicm9sZSI6InJlc3RhdXJhbnRfb3duZXIiLCJyZXN0YXVyYW50X2lkIjoxLCJpYXQiOjE2OTk0MjA4MDB9.test"

def test_image_upload():
    """Test PATCH /restaurants/{id}/image con archivo"""
    print(f"\n📸 Test: Subir imagen a restaurante {RESTAURANT_ID}")
    
    # Crear una imagen de prueba simple
    image_path = "test_image.png"
    
    # Si no existe, usar una URL de imagen de prueba pequeña
    if not os.path.exists(image_path):
        print(f"  ⚠️  No encontrado {image_path}, descargando imagen de prueba...")
        try:
            response = requests.get("https://placehold.co/200x200.png")
            with open(image_path, "wb") as f:
                f.write(response.content)
        except Exception as e:
            print(f"  ❌ Error descargando imagen: {e}")
            return False
    
    try:
        with open(image_path, "rb") as f:
            files = {"image_file": (image_path, f, "image/png")}
            headers = {"Authorization": f"Bearer {RESTAURANT_TOKEN}"}
            
            response = requests.patch(
                f"{BASE_URL}/restaurants/{RESTAURANT_ID}/image",
                files=files,
                headers=headers
            )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Imagen subida correctamente")
            print(f"     - Base64 length: {len(data['image_base64'])} chars")
            print(f"     - Content-Type: {data['content_type']}")
            return True
        else:
            print(f"  ❌ Error: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_image_retrieve():
    """Test GET /restaurants/{id}/image"""
    print(f"\n📥 Test: Recuperar imagen del restaurante {RESTAURANT_ID}")
    
    try:
        response = requests.get(f"{BASE_URL}/restaurants/{RESTAURANT_ID}/image")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Imagen recuperada correctamente")
            print(f"     - Base64 length: {len(data['image_base64'])} chars")
            print(f"     - Data URI starts with: {data['data_uri'][:50]}...")
            
            # Verificar que podemos decodificar el base64
            try:
                image_data = base64.b64decode(data['image_base64'])
                print(f"     - Decoded size: {len(image_data)} bytes")
            except Exception as e:
                print(f"     ❌ Error decodificando Base64: {e}")
                return False
            
            return True
        elif response.status_code == 404:
            print(f"  ℹ️  No hay imagen (esperado si es la primera vez)")
            return True
        else:
            print(f"  ❌ Error: {response.status_code}")
            print(f"     Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("🧪 Test de endpoints de imagen Base64")
    print("=" * 50)
    
    # Test 1: Subir imagen
    upload_ok = test_image_upload()
    
    # Test 2: Recuperar imagen
    retrieve_ok = test_image_retrieve()
    
    print("\n" + "=" * 50)
    if upload_ok and retrieve_ok:
        print("✅ Todos los tests pasaron")
        return 0
    else:
        print("❌ Algunos tests fallaron")
        return 1

if __name__ == "__main__":
    sys.exit(main())
