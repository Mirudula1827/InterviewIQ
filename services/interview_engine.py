import json
import uuid
from groq import Groq
import re

# Temporary in-memory storage
INTERVIEW_SESSIONS = {}
MAX_QUESTIONS = 8


def start_interview(resume_text, jd_text, api_key):
    """Creates a new interview session and generates the first question."""
    session_id = str(uuid.uuid4())

    client = Groq(api_key=api_key)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        
        messages=[
            {
                "role": "user",
                "content": f"""
You are an experienced technical interviewer.
Candidate Resume:
{resume_text}
Job Description:
{jd_text}
Generate ONE introductory interview question.
Rules:

Ask only ONE question.
Make it natural.
Use resume and JD context.
Do not ask about technologies not mentioned.
Return only the question text.
""",
            }
        ],
    )
    first_question = response.choices[0].message.content.strip()
    INTERVIEW_SESSIONS[session_id] = {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "current_question": first_question,
        "history": [],
        "question_count": 1,
        "scores": [],
    }
    return {"session_id": session_id, "question": first_question}


def evaluate_answer(session_id, answer, api_key):
    """Evaluates candidate answer and decides whether to continue or wrap up."""
    print("\n=== DEBUG ===")
    print("Received:", session_id)
    print("Stored sessions:", INTERVIEW_SESSIONS.keys())
    print("=============\n")

    session = INTERVIEW_SESSIONS.get(session_id)

    if not session:
        raise ValueError("Invalid session ID")

    resume_text = session["resume_text"]
    jd_text = session["jd_text"]
    current_question = session["current_question"]
    history = session["history"]

    client = Groq(api_key=api_key)

    # Note: Double curly braces {{ and }} are used for the JSON schema 
    # to prevent Python f-string parser from failing with ValueError.
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": f"""
You are conducting a realistic mock interview.
Candidate Resume:
{resume_text}
Job Description:
{jd_text}
Interview History:
{history}
Current Question:
{current_question}
Candidate Answer:
{answer}
Your tasks:

Evaluate the answer.
Give a score from 1-10.
Identify strengths.
Identify weaknesses.
Give one improvement suggestion.
Decide whether to ask a follow-up question or move to a new topic.
Generate exactly ONE next interview question.
Rules:

Use both resume and JD.
Ask realistic interview questions.
Avoid repeating questions.
Use conversation history.
Ask follow-ups when appropriate.
Do not ask about technologies not mentioned.
Return ONLY a valid JSON object.

Do NOT write explanations.
Do NOT write markdown.
Do NOT use ```json.
Do NOT write any text before or after the JSON.
Your response MUST be parseable by Python's json.loads().

The JSON schema is:

{{
  "score": 8,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestion": "...",
  "next_question": "..."
}}
""",
            }
        ],
    )

    content = response.choices[0].message.content.strip()

    print("\n=== RAW LLM RESPONSE ===")
    print(content)
    print("========================\n")

    # Remove markdown codeblocks if the model accidentally wraps the JSON
    content = re.sub(r"^```(?:json)?", "", content)
    content = re.sub(r"```$", "", content).strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(f"Groq did not return valid JSON:\n{content}")

    # Robust parsing of JSON keys to ensure types are correct and keys exist
    try:
        score_val = result.get("score", 0)
        if isinstance(score_val, str):
            # Extract numbers if it is string format, e.g. "8/10" -> 8
            match = re.search(r'\d+', score_val)
            score = int(match.group()) if match else 0
        else:
            score = int(score_val)
    except Exception:
        score = 5  # fallback score

    # Clean and validate strengths array
    strengths = result.get("strengths", [])
    if isinstance(strengths, str):
        strengths = [strengths]
    elif not isinstance(strengths, list):
        strengths = []

    # Clean and validate weaknesses array
    weaknesses = result.get("weaknesses", [])
    if isinstance(weaknesses, str):
        weaknesses = [weaknesses]
    elif not isinstance(weaknesses, list):
        weaknesses = []

    # Clean and validate suggestion string
    suggestion = result.get("suggestion", "")
    if not isinstance(suggestion, str):
        suggestion = str(suggestion)

    # Clean and validate next_question string
    next_question = result.get("next_question", "")
    if not isinstance(next_question, str):
        next_question = str(next_question)

    # Store current response data in session history
    session["history"].append(
        {"question": current_question, "answer": answer, "score": score}
    )
    session["scores"].append(score)

    # Check if this was the final question
    if session["question_count"] >= MAX_QUESTIONS:
        avg_score = (
            round(sum(session["scores"]) / len(session["scores"]), 1)
            if session["scores"]
            else 0
        )

        return {
            "score": score,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggestion": suggestion,
            "final_score": avg_score,
            "questions_answered": session["question_count"],
            "interview_completed": True,
            "message": "Interview completed successfully",
        }

    # If not finished, prepare state for the next turn
    session["current_question"] = next_question
    session["question_count"] += 1

    return {
        "score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestion": suggestion,
        "next_question": next_question,
        "question_number": session["question_count"],
        "interview_completed": False,
    }
