# routers/resume.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.resume_parser import extract_resume_text

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported.")

    text = extract_resume_text(file.file)
    return {"resume_text": text, "word_count": len(text.split())}