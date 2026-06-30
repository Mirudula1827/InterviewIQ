# services/resume_parser.py
import pdfplumber
import io

def extract_resume_text(file_bytes: bytes) -> str:
    resume_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            resume_text += page.extract_text() or ""
    return resume_text