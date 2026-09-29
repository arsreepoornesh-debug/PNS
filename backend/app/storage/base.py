from abc import ABC, abstractmethod
from typing import BinaryIO

class StorageProvider(ABC):
    @abstractmethod
    async def save_file(self, file_content: bytes, destination_name: str) -> str:
        """Saves file and returns file path or URL."""
        pass
        
    @abstractmethod
    async def get_file_bytes(self, file_path: str) -> bytes:
        """Retrieves raw file bytes."""
        pass
        
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Deletes file."""
        pass
