# routers/answer.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
from services.interview_engine import start_interview, evaluate_answer

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class StartRequest(BaseModel):
    resume_text: str
    jd_text: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

@router.post("/start")
async def start(req: StartRequest):
    return start_interview(req.resume_text, req.jd_text, GROQ_API_KEY)

@router.post("/answer")
async def answer(req: AnswerRequest):
    return evaluate_answer(req.session_id, req.answer, GROQ_API_KEY)