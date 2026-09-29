from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class DocumentPage:
    page_number: int
    text: str

@dataclass
class ParsedDocument:
    raw_text: str
    pages: List[DocumentPage] = field(default_factory=list)
    page_count: int = 1
    file_type: str = "pdf"
    is_scanned_or_empty: bool = False
    warning: Optional[str] = None
