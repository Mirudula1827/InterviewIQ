from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import re
from services.question_generator import generate_questions

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class QuestionRequest(BaseModel):
    resume_text: str
    jd_text: str

def parse_questions(raw: str) -> list[str]:
    lines = raw.strip().split("\n")
    questions = []
    for line in lines:
        
        cleaned = re.sub(r"^[\s]*[\d]+[.)]\s*", "", line).strip()
        if cleaned and "?" in cleaned or len(cleaned) > 20:
            questions.append(cleaned)
    return questions[:8]  

@router.post("/generate")
async def generate(req: QuestionRequest):
    if not req.resume_text or not req.jd_text:
        raise HTTPException(status_code=400, detail="resume_text and jd_text are required")
    
    raw = generate_questions(req.resume_text, req.jd_text, GROQ_API_KEY)
    questions = parse_questions(raw)
    return {"questions": questions}