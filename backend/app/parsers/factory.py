import os
from app.parsers.base import ParsedDocument
from app.parsers.pdf_parser import parse_pdf
from app.parsers.docx_parser import parse_docx

def parse_resume_file(file_path: str) -> ParsedDocument:
    """
    Dispatcher to parse PDF or DOCX file.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return parse_docx(file_path)
    else:
        return ParsedDocument(
            raw_text="",
            pages=[],
            page_count=0,
            file_type=ext,
            is_scanned_or_empty=True,
            warning=f"Unsupported file format: {ext}"
        )
