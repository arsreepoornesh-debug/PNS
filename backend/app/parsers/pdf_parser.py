import fitz # PyMuPDF
import logging
import re
from app.parsers.base import ParsedDocument, DocumentPage

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize excessive newlines and whitespace while preserving structure
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()

def parse_pdf(file_path: str) -> ParsedDocument:
    """
    Extracts text per page using PyMuPDF (fitz) with layout awareness and error handling.
    """
    pages = []
    full_text_parts = []
    warning = None
    
    try:
        doc = fitz.open(file_path)
        page_count = len(doc)
        
        if page_count == 0:
            return ParsedDocument(
                raw_text="",
                pages=[],
                page_count=0,
                file_type="pdf",
                is_scanned_or_empty=True,
                warning="PDF contains 0 pages."
            )
            
        for page_idx in range(page_count):
            page = doc.load_page(page_idx)
            page_text = page.get_text("text") or ""
            cleaned = clean_text(page_text)
            pages.append(DocumentPage(page_number=page_idx + 1, text=cleaned))
            if cleaned:
                full_text_parts.append(f"--- Page {page_idx + 1} ---\n{cleaned}")
                
        doc.close()
        
        full_text = "\n\n".join(full_text_parts).strip()
        
        # Check if text is suspiciously short (scanned PDF)
        is_scanned = len(full_text.strip()) < 50
        if is_scanned:
            warning = "Resume appears to be a scanned image or empty. OCR is recommended for scanned PDFs."
            
        return ParsedDocument(
            raw_text=full_text,
            pages=pages,
            page_count=max(1, page_count),
            file_type="pdf",
            is_scanned_or_empty=is_scanned,
            warning=warning
        )
        
    except Exception as e:
        logger.error(f"Error parsing PDF file {file_path}: {e}", exc_info=True)
        return ParsedDocument(
            raw_text="",
            pages=[],
            page_count=1,
            file_type="pdf",
            is_scanned_or_empty=True,
            warning=f"Malformed or unreadable PDF: {str(e)}"
        )
