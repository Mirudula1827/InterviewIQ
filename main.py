# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume, questions, match
from dotenv import load_dotenv
from routers import interview
load_dotenv()
app = FastAPI(title="Interview Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(match.router, prefix="/api/match", tags=["match"])
app.include_router(interview.router, prefix="/api/answer", tags=["answer"])
@app.get("/")
def root():
    return {
        "message": "Interview Analyzer API Running"
    }
@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(
    interview.router,
    prefix="/api/interview",
    tags=["interview"]
)