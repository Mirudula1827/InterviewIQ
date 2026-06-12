import pdfplumber

def extract_resume_text(resume_file):
    resume_text = ""
    with pdfplumber.open(resume_file) as pdf:
        for page in pdf.pages:
            resume_text += page.extract_text() or ""
    return resume_text