# routers/answer.py
from fastapi import APIRouter, UploadFile, File
from services.speech_to_text import transcribe_audio

router = APIRouter()

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    file_bytes = await file.read()
    result = transcribe_audio(file.filename, file_bytes)

    if not result["success"]:
        return {"success": False, "error": result["error"]}

    return result