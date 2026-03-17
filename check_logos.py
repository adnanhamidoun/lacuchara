#!/usr/bin/env python3
import os
import sys

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from azure.storage.blob import BlobServiceClient

# Credenciales desde variables de entorno
connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
if not connection_string:
    print("❌ Error: AZURE_STORAGE_CONNECTION_STRING no está configurada en .env")
    sys.exit(1)

container_name = "company-assets"

print("Verificando logos en Azure Blob Storage...")
print(f"Container: {container_name}\n")

try:
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    
    # Listar todos los blobs
    blobs = list(container_client.list_blobs())
    
    if blobs:
        print(f"✓ Encontrados {len(blobs)} archivo(s):")
        for blob in blobs:
            print(f"  - {blob.name} ({blob.size} bytes)")
            # Generar URL accesible
            blob_client = container_client.get_blob_client(blob.name)
            print(f"    URL: {blob_client.url}\n")
    else:
        print("✗ No hay archivos en el container")
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
