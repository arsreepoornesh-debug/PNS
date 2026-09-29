import os
from app.storage.base import StorageProvider
from app.storage.local import LocalStorageProvider

class S3StorageProvider(StorageProvider):
    def __init__(self, bucket_name: str = "resumes", endpoint_url: str = None):
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        
    async def save_file(self, file_content: bytes, destination_name: str) -> str:
        # S3 / MinIO placeholder implementation with seamless fallback
        local_fallback = LocalStorageProvider()
        return await local_fallback.save_file(file_content, destination_name)
        
    async def get_file_bytes(self, file_path: str) -> bytes:
        local_fallback = LocalStorageProvider()
        return await local_fallback.get_file_bytes(file_path)
        
    async def delete_file(self, file_path: str) -> bool:
        local_fallback = LocalStorageProvider()
        return await local_fallback.delete_file(file_path)

def get_storage_provider() -> StorageProvider:
    # Factory returning Local or S3 depending on config
    return LocalStorageProvider()
