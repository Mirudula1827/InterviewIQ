# routers/resume.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from services.resume_parser import extract_resume_text

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        text = extract_resume_text(contents)
        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the PDF. It might be scanned, encrypted, or empty."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    return {"resume_text": text, "word_count": len(text.split())}