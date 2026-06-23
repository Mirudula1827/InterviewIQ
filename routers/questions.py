# routers/questions.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
from services.question_generator import generate_questions

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class QuestionRequest(BaseModel):
    resume_text: str
    jd_text: str

@router.post("/generate")
async def generate(req: QuestionRequest):
    questions = generate_questions(req.resume_text, req.jd_text, GROQ_API_KEY)
    return {"questions": questions}