import os
import aiofiles
from app.core.config import settings
from app.storage.base import StorageProvider

class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = settings.STORAGE_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)
        
    async def save_file(self, file_content: bytes, destination_name: str) -> str:
        safe_name = os.path.basename(destination_name)
        target_path = os.path.join(self.base_dir, safe_name)
        
        # Write binary asynchronously
        with open(target_path, "wb") as f:
            f.write(file_content)
            
        return target_path
        
    async def get_file_bytes(self, file_path: str) -> bytes:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            return f.read()
            
    async def delete_file(self, file_path: str) -> bool:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
