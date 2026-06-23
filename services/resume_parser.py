# services/resume_parser.py
import pdfplumber

def extract_resume_text(file_obj) -> str:
    resume_text = ""
    with pdfplumber.open(file_obj) as pdf:
        for page in pdf.pages:
            resume_text += page.extract_text() or ""
    return resume_text