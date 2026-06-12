import json
from groq import Groq

def analyze_match(resume_text, jd_input, api_key):
    client = Groq(api_key=api_key)
    
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": f"""Compare this resume against the job description and return ONLY a JSON object, nothing else.

Resume:
{resume_text}

Job Description:
{jd_input}

Return exactly this JSON format:
{{
    "match_score": 75,
    "matching_skills": ["Python", "FastAPI"],
    "missing_skills": ["Docker", "Kubernetes"],
    "verdict": "Strong match with some skill gaps"
}}"""
            }
        ]
    )
    
    raw = response.choices[0].message.content
    json_start = raw.find("{")
    json_end = raw.rfind("}") + 1
    data = json.loads(raw[json_start:json_end])
    return data