import os
from fastapi import APIRouter ,HTTPException
from pydantic import BaseModel
from services.interview_engine import evaluate_answer, start_interview

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