import os
import json
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from services.interview_engine import evaluate_answer, start_interview
from services.speech_to_text import transcribe_audio

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class StartInterviewRequest(BaseModel):
    resume_text: str
    jd_text: str
    question_count: int = 8
    difficulty: str = "Medium"


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/start")
async def start(req: StartInterviewRequest):
    return start_interview(
        req.resume_text,
        req.jd_text,
        GROQ_API_KEY,
        req.question_count,
        req.difficulty
    )


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


DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "completed_interviews.json")

@router.get("/completed")
async def get_completed_interviews():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            interviews = json.load(f)
        # Sort by date descending (most recent first)
        return sorted(interviews, key=lambda x: x.get("date", ""), reverse=True)
    except Exception:
        return []

@router.get("/completed/{session_id}")
async def get_completed_interview_detail(session_id: str):
    if not os.path.exists(DATA_FILE):
        raise HTTPException(status_code=404, detail="Interview not found")
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            interviews = json.load(f)
        for item in interviews:
            if item.get("session_id") == session_id:
                return item
        raise HTTPException(status_code=404, detail="Interview not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))