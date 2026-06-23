# routers/match.py
from fastapi import APIRouter
from pydantic import BaseModel
import os
from services.match_analyzer import analyze_match

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class MatchRequest(BaseModel):
    resume_text: str
    jd_text: str

@router.post("/analyze")
async def analyze(req: MatchRequest):
    return analyze_match(req.resume_text, req.jd_text, GROQ_API_KEY)