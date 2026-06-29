import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from services.interview_engine import evaluate_answer, start_interview
from services.speech_to_text import transcribe_audio

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class StartInterviewRequest(BaseModel):
    resume_text: str
    jd_text: str


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/start")
async def start(req: StartInterviewRequest):
    return start_interview(req.resume_text, req.jd_text, GROQ_API_KEY)


@router.post("/answer")
async def answer(req: AnswerRequest):
    return evaluate_answer(req.session_id, req.answer, GROQ_API_KEY)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    contents = await file.read()
    res = transcribe_audio(file.filename, contents)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Transcription failed"))
    return {"transcript": res.get("transcript")}