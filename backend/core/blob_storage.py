import os
from dataclasses import dataclass
from pathlib import Path

try:
    from azure.storage.blob import BlobServiceClient, ContentSettings
    AZURE_BLOB_AVAILABLE = True
except ImportError:
    BlobServiceClient = None
    ContentSettings = None
    AZURE_BLOB_AVAILABLE = False


DEFAULT_CUISINE_IMAGES = {
    "grill": "https://placehold.co/800x480?text=Parrilla",
    "spanish": "https://placehold.co/800x480?text=Cocina+Espanola",
    "mediterranean": "https://placehold.co/800x480?text=Mediterranea",
    "stew": "https://placehold.co/800x480?text=Guisos",
    "fried": "https://placehold.co/800x480?text=Fritura",
    "italian": "https://placehold.co/800x480?text=Italiana",
    "asian": "https://placehold.co/800x480?text=Asiatica",
    "latin": "https://placehold.co/800x480?text=Latina",
    "arabic": "https://placehold.co/800x480?text=Arabe",
    "avantgarde": "https://placehold.co/800x480?text=Vanguardia",
    "plantbased": "https://placehold.co/800x480?text=Plant+Based",
    "streetfood": "https://placehold.co/800x480?text=Street+Food",
}


def get_default_image_url(cuisine_type: str | None) -> str:
    normalized = (cuisine_type or "").strip().lower()
    return DEFAULT_CUISINE_IMAGES.get(normalized, "https://placehold.co/800x480?text=Restaurante")


@dataclass
class BlobManager:
    container_name: str
    connection_string: str | None = None
    local_root: Path | None = None

    def __post_init__(self) -> None:
        self._blob_service_client = None
        if self.connection_string and AZURE_BLOB_AVAILABLE:
            self._blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)

        if self.local_root is None:
            self.local_root = Path(__file__).resolve().parents[1] / "api" / "static" / "images"
        self.local_root.mkdir(parents=True, exist_ok=True)

    @property
    def use_azure(self) -> bool:
        return self._blob_service_client is not None

    def upload_restaurant_image(self, restaurant_id: int, file_content: bytes, filename: str) -> str | None:
        # Usar solo el nombre del archivo, sin subcarpetas: res_1.jpg, res_2.jpg, etc.
        blob_name = filename

        if self.use_azure:
            container_client = self._blob_service_client.get_container_client(self.container_name)
            if not container_client.exists():
                container_client.create_container()
            blob_client = container_client.get_blob_client(blob_name)
            content_settings = None
            if ContentSettings is not None:
                ext = Path(filename).suffix.lower()
                content_type = {
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".png": "image/png",
                    ".webp": "image/webp",
                    ".gif": "image/gif",
                }.get(ext, "application/octet-stream")
                content_settings = ContentSettings(content_type=content_type)
            blob_client.upload_blob(file_content, overwrite=True, content_settings=content_settings)
            return blob_name

        safe_filename = f"restaurant_{restaurant_id}_{Path(filename).name}"
        target_path = self.local_root / safe_filename
        target_path.write_bytes(file_content)
        return safe_filename

    def get_blob_sas_url(self, blob_name: str) -> str | None:
        if self.use_azure:
            blob_client = self._blob_service_client.get_blob_client(self.container_name, blob_name)
            return blob_client.url
        return f"/static/images/{blob_name}"


def get_blob_manager() -> BlobManager:
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    container_name = os.getenv("AZURE_BLOB_CONTAINER_NAME", "azca-images")
    return BlobManager(container_name=container_name, connection_string=connection_string)


def get_restaurant_image_url(restaurant_id: int) -> str:
    """Get the URL for a restaurant image from Azure Storage.
    
    Images are stored as res_{restaurant_id}.jpg in the restaurant-profiles container.
    """
    storage_account = os.getenv("AZURE_STORAGE_ACCOUNT_NAME", "")
    container_name = os.getenv("AZURE_BLOB_CONTAINER_NAME", "restaurant-profiles")
    
    if storage_account:
        # URL format: https://{account_name}.blob.core.windows.net/{container}/{blob}
        blob_name = f"res_{restaurant_id}.jpg"
        url = f"https://{storage_account}.blob.core.windows.net/{container_name}/{blob_name}"
        return url
    
    # Fallback to default image if no Azure Storage configured
    return get_default_image_url("restaurant")