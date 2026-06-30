import json
import uuid
from groq import Groq
import re
import os
import time
from datetime import datetime

INTERVIEW_SESSIONS = {}
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DATA_FILE = os.path.join(DATA_DIR, "completed_interviews.json")

def save_completed_interview(session_id, session, report):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        
        interviews = []
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    interviews = json.load(f)
            except Exception:
                interviews = []
        
        # Prevent writing duplicate interviews
        if any(item.get("session_id") == session_id for item in interviews):
            print(f"Session {session_id} already saved. Skipping.")
            return
        
        # Calculate practice time
        start_time = session.get("start_time", time.time())
        practice_time = int(time.time() - start_time)
        
        # Extract title or job role from JD if possible
        jd_text = session.get("jd_text", "").strip()
        role = "AI Mock Interview"
        if jd_text:
            # Clean first non-empty line
            lines = [line.strip() for line in jd_text.split("\n") if line.strip()]
            if lines:
                first_line = lines[0]
                if len(first_line) > 50:
                    first_line = first_line[:47] + "..."
                role = first_line
        
        history_list = session.get("history", [])
        response_times = [h.get("response_time", 0) for h in history_list if "response_time" in h]
        avg_response_time = round(sum(response_times) / len(response_times), 1) if response_times else 0.0

        completed = {
            "session_id": session_id,
            "role": role,
            "date": datetime.utcnow().isoformat() + "Z",
            "practice_time": practice_time,
            "overall_score": report.get("overall_score", 5.0),
            "questions_answered": len(history_list),
            "hiring_recommendation": report.get("hiring_recommendation", ""),
            "strengths": report.get("strengths", []),
            "weaknesses": report.get("weaknesses", []),
            "suggestions": report.get("suggestions", []),
            "metrics": report.get("metrics", {}),
            "history": history_list,
            "difficulty": session.get("difficulty", "Medium"),
            "avg_response_time": avg_response_time
        }
        
        interviews.append(completed)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(interviews, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving completed interview: {e}")

MAX_QUESTIONS = 8


def start_interview(resume_text, jd_text, api_key, question_count=8, difficulty="Medium"):
    session_id = str(uuid.uuid4())
    client = Groq(api_key=api_key)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are a professional human recruiter and senior technical interviewer conducting a job interview. "
                    f"The difficulty level of the interview is {difficulty}. "
                    "You speak naturally, warmly, and professionally. "
                    "You ask ONE question at a time. "
                    "Return only the opening question text, beginning with a brief, natural greeting."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Candidate Resume:\n{resume_text}\n\n"
                    f"Job Description:\n{jd_text}\n\n"
                    f"Start the interview with a brief, natural greeting and a professional opening question "
                    f"suitable for a {difficulty} level interview based on the candidate's resume/JD. "
                    "For example: 'Hello! Thank you for taking the time to speak with me today. To start off, can you tell me about your experience with...?'"
                ),
            },
        ],
    )



    first_question = response.choices[0].message.content.strip()

    INTERVIEW_SESSIONS[session_id] = {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "current_question": first_question,
        "history": [],        # list of {question, answer, internal_score}
        "question_count": 1,
        "max_questions": question_count,
        "difficulty": difficulty,
        "scores": [],
        "start_time": time.time(),
        "last_question_time": time.time(),
    }
    return {"session_id": session_id, "question": first_question}

def _next_question(client, resume_text, jd_text, history, current_question, answer, difficulty="Medium"):
    """
    Internally scores the answer, then returns only the next question.
    The score is stored in session but NEVER shown to the user mid-interview.
    """
    history_text = "\n".join(
        [f"Q{i+1}: {h['question']}\nA{i+1}: {h['answer']}" for i, h in enumerate(history)]
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are a professional human recruiter and senior technical interviewer. "
                    f"The difficulty level of the interview is {difficulty}. "
                    f"You conduct natural, conversational interviews. "
                    f"You evaluate answers silently and decide on the next reaction and question. "
                    f"You never mention scores, evaluation metrics, strengths, or weaknesses to the candidate. "
                    f"Reflect the difficulty level in the complexity of your follow-ups: "
                    f"Easy means simple conceptual questions, Medium means standard professional depth, Hard means deep system design, edge cases, and architectural tradeoffs. "
                    "You respond ONLY with a JSON object containing 'internal_score' and 'next_question'. "
                    "No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Candidate Resume:\n{resume_text}\n\n"
                    f"Job Description:\n{jd_text}\n\n"
                    f"Interview history so far:\n{history_text}\n\n"
                    f"You just asked: {current_question}\n"
                    f"Candidate answered: {answer}\n\n"
                    "Your tasks:\n"
                    "1. Score the candidate's last answer from 1 to 10 based on correctness, depth, and relevance (this is kept internal and not shown).\n"
                    "2. Formulate the next response (`next_question`). It must consist of two parts, integrated naturally:\n"
                    "   - A brief, professional, and conversational acknowledgment or reaction to their answer (e.g., "
                    "'That's a good point.', 'Interesting approach.', 'That makes sense.', 'Could you elaborate on how you handled...?', "
                    "or a natural reaction referring to a specific detail in their answer).\n"
                    "   - The next question. This should either be an intelligent follow-up to their answer (if appropriate to probe deeper "
                    "or clarify details) or a transition to another topic from the resume/JD to maintain a continuous dialogue.\n"
                    "3. Ensure the dialogue flows smoothly, feels like a real interview conversation rather than an exam with "
                    "independent sequential questions, and references past context naturally when appropriate.\n\n"
                    "Rules:\n"
                    "- Do NOT mention the word 'score', 'rating', 'feedback', 'evaluation', 'strength', or 'weakness' in the question.\n"
                    "- The response in `next_question` must include both the natural acknowledgment/reaction and the next question/follow-up.\n"
                    "- The next_question must end with a question mark.\n"
                    "- Keep the response concise, professional, and natural, exactly as a human interviewer would speak.\n\n"
                    "Return ONLY this JSON format:\n"
                    '{{"internal_score": 7, "next_question": "<your reaction/acknowledgment> <your follow-up/next question>?"}}'
                ),
            },
        ],
    )



    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```(?:json)?", "", content)
    content = re.sub(r"```$", "", content).strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        # Last resort fallback — extract anything that looks like a question
        match = re.search(r'"next_question"\s*:\s*"([^"]+)"', content)
        if match:
            return 5, match.group(1).strip()
        raise ValueError(f"Could not parse next question JSON:\n{content}")

    score = int(result.get("internal_score", 5))
    next_q = result.get("next_question", "").strip()

    if not next_q or "?" not in next_q:
        raise ValueError(f"next_question missing or malformed: {next_q}")

    return score, next_q


def _final_report(client, resume_text, jd_text, history, scores):
    """
    Runs once after the last answer.
    Evaluates the full interview transcript and returns a structured report.
    """
    avg = round(sum(scores) / len(scores), 1) if scores else 5.0

    history_text = "\n".join(
        [f"Q{i+1}: {h['question']}\nA{i+1}: {h['answer']}" for i, h in enumerate(history)]
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior hiring manager writing a post-interview evaluation. "
                    "You are precise, honest, and specific. "
                    "You base every observation strictly on what the candidate actually said. "
                    "You never invent details. You never hallucinate skills or projects. "
                    "Return ONLY a JSON object. No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Candidate Resume:\n{resume_text}\n\n"
                    f"Job Description:\n{jd_text}\n\n"
                    f"Full Interview Transcript:\n{history_text}\n\n"
                    f"Internal per-answer scores: {scores}\n"
                    f"Computed average score: {avg}/10\n\n"
                    "Write a performance summary based ONLY on what was said in the transcript above.\n\n"
                    "Rules:\n"
                    "- overall_score: use the computed average exactly, do not invent a new number.\n"
                    "- hiring_recommendation: one honest sentence. Choose from: "
                    "'Strong Hire', 'Lean Hire', 'Borderline', 'Lean No Hire', 'No Hire'. "
                    "Add one sentence of reasoning based on the transcript.\n"
                    "- strengths: 2-4 specific things the candidate demonstrated IN the transcript. "
                    "Quote or paraphrase actual answers. No generic praise.\n"
                    "- weaknesses: 2-3 specific gaps observed IN the transcript. "
                    "Be direct. If a question was skipped or answered vaguely, say so.\n"
                    "- suggestions: 2-3 concrete, actionable steps the candidate can take to improve. "
                    "Each suggestion must directly address a weakness observed above.\n"
                    "- metrics: evaluate exactly these 3 dimensions based on the transcript:\n"
                    "  * technical_knowledge: score/10 + one sentence observation\n"
                    "  * problem_solving: score/10 + one sentence observation\n"
                    "  * communication: score/10 + one sentence observation\n\n"
                    "Return ONLY this JSON structure:\n"
                    '{{\n'
                    '  "overall_score": 7.2,\n'
                    '  "hiring_recommendation": "Lean Hire — strong fundamentals but gaps in system design.",\n'
                    '  "strengths": ["...", "..."],\n'
                    '  "weaknesses": ["...", "..."],\n'
                    '  "suggestions": ["...", "..."],\n'
                    '  "metrics": {{\n'
                    '    "technical_knowledge": {{"score": 8.0, "note": "..."}},\n'
                    '    "problem_solving": {{"score": 6.5, "note": "..."}},\n'
                    '    "communication": {{"score": 7.0, "note": "..."}}\n'
                    '  }}\n'
                    '}}'
                ),
            },
        ],
    )

    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```(?:json)?", "", content)
    content = re.sub(r"```$", "", content).strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(f"Final report JSON parse failed:\n{content}")

    # Safe extraction — never crash on missing keys
    metrics = result.get("metrics", {})

    def safe_metric(key):
        m = metrics.get(key, {})
        return {
            "score": float(m.get("score", 0)),
            "note": str(m.get("note", "")),
        }

    return {
        "overall_score": avg,           # always use computed avg, not LLM's number
        "hiring_recommendation": str(result.get("hiring_recommendation", "")),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "suggestions": result.get("suggestions", []),
        "metrics": {
            "technical_knowledge": safe_metric("technical_knowledge"),
            "problem_solving": safe_metric("problem_solving"),
            "communication": safe_metric("communication"),
        },
    }


def _score_answer(client, resume_text, jd_text, history, current_question, answer, difficulty="Medium"):
    """
    Scores the final answer from 1 to 10 based on candidate response.
    """
    history_text = "\n".join(
        [f"Q{i+1}: {h['question']}\nA{i+1}: {h['answer']}" for i, h in enumerate(history)]
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior technical interviewer. "
                    "You evaluate answers silently. "
                    "You respond ONLY with a JSON object. No markdown, no explanation."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Candidate Resume:\n{resume_text}\n\n"
                    f"Job Description:\n{jd_text}\n\n"
                    f"Interview so far:\n{history_text}\n\n"
                    f"You just asked: {current_question}\n"
                    f"Candidate answered: {answer}\n\n"
                    f"Your task: Score this answer from 1 to 10 based on correctness, depth, and relevance, "
                    f"calibrated for a {difficulty} level interview (score strictly for Hard difficulty, normally for Medium, and kindly for Easy).\n\n"
                    "Return ONLY this JSON:\n"
                    '{"score": 7}'
                ),
            },
        ],
    )

    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```(?:json)?", "", content)
    content = re.sub(r"```$", "", content).strip()
    try:
        result = json.loads(content)
        return int(result.get("score", 5))
    except Exception:
        return 5


def evaluate_answer(session_id, answer, api_key):
    session = INTERVIEW_SESSIONS.get(session_id)
    if not session:
        raise ValueError(f"Invalid session ID: {session_id}")

    resume_text = session["resume_text"]
    jd_text = session["jd_text"]
    current_question = session["current_question"]
    client = Groq(api_key=api_key)
    
    # Calculate response time
    elapsed = int(time.time() - session.get("last_question_time", time.time()))
    session["last_question_time"] = time.time()

    difficulty = session.get("difficulty", "Medium")
    max_questions = session.get("max_questions", 8)

    # Last question — generate final report
    if session["question_count"] >= max_questions:
        # Store final answer first
        session["history"].append({"question": current_question, "answer": answer, "response_time": elapsed})
        
        # Score the final answer using LLM instead of a hardcoded 5
        score = _score_answer(
            client, resume_text, jd_text,
            session["history"][:-1], current_question, answer,
            difficulty
        )
        session["scores"].append(score)

        report = _final_report(
            client, resume_text, jd_text,
            session["history"], session["scores"]
        )
        
        # Save report to persistent local JSON storage
        save_completed_interview(session_id, session, report)
        
        # Clean up session from active sessions
        INTERVIEW_SESSIONS.pop(session_id, None)

        return {
            "interview_completed": True,
            "questions_answered": len(session.get("history", [])),
            **report,
        }


    # Mid-interview — get next question silently
    score, next_question = _next_question(
        client, resume_text, jd_text,
        session["history"], current_question, answer,
        difficulty
    )

    # Store Q&A + internal score
    session["history"].append({"question": current_question, "answer": answer, "response_time": elapsed})
    session["scores"].append(score)
    session["current_question"] = next_question
    session["question_count"] += 1

    return {
        "interview_completed": False,
        "next_question": next_question,
        "question_number": session["question_count"],
    }