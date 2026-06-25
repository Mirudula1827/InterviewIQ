import json
import re
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from concurrent.futures import ThreadPoolExecutor

# LLM extracts skills from text
def extract_skills_via_llm(text: str, client: Groq) -> list[str]:
    prompt = """Extract all technical and professional skills from the text below.

Rules:
- Return ONLY a valid JSON array of strings
- All skills must be lowercase
- Be specific: "machine learning" not "ml experience"  
- Include tools, languages, frameworks, methodologies
- No explanations, no markdown, no extra text

Example output: ["python", "fastapi", "docker", "sql", "machine learning"]

Text:
""" + text

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,  
    )

    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

    try:
        skills = json.loads(raw)

        return list({s.lower().strip() for s in skills if isinstance(s, str)})
    except json.JSONDecodeError:
       
        return [m.lower() for m in re.findall(r'"([^"]+)"', raw)]
        

def compute_set_match(resume_skills: list, jd_skills: list) -> dict:

    resume_set = set(resume_skills)
    jd_set     = set(jd_skills)

    matched = sorted(resume_set & jd_set)          
    missing = sorted(jd_set - resume_set)           
    extra   = sorted(resume_set - jd_set)         

    return {
        "matched": matched,
        "missing": missing,
        "extra":   extra,
    }

def compute_semantic_score(resume_skills: list, jd_skills: list) -> float:
    """
    Compares the full skill bags as text using TF-IDF cosine similarity.
    Handles near-matches that exact set ops miss.
    Returns a float 0.0 → 1.0
    """
    if not resume_skills or not jd_skills:
        return 0.0

    resume_doc = " ".join(resume_skills)
    jd_doc     = " ".join(jd_skills)

    vectorizer = TfidfVectorizer()
    tfidf      = vectorizer.fit_transform([resume_doc, jd_doc])
    score      = cosine_similarity(tfidf[0], tfidf[1])[0][0]

    return round(float(score), 4)

def compute_final_score(set_data: dict, jd_skills: list, semantic: float) -> dict:
   
    total_jd = len(jd_skills)

    exact_rate = len(set_data["matched"]) / total_jd if total_jd > 0 else 0.0

    EXACT_WEIGHT    = 0.70
    SEMANTIC_WEIGHT = 0.30
    raw_score = (exact_rate * EXACT_WEIGHT) + (semantic * SEMANTIC_WEIGHT)

    final = round(raw_score * 100)  
    if final >= 80:   label = "Strong match"
    elif final >= 60: label = "Good match"
    elif final >= 40: label = "Partial match"
    else:             label = "Weak match"

    return {
        "final_score":    final,                         
        "score_label":    label,                         
        "exact_rate_pct": round(exact_rate * 100),       
        "semantic_score": round(semantic * 100),         
        "fraction":       f"{len(set_data['matched'])}/{total_jd}",  
    }



def generate_verdict(score_data: dict, set_data: dict, client: Groq) -> dict:
   
    prompt = f"""You are a career coach reviewing a resume–job match analysis.
The numbers below were computed by code — do NOT change them.
Your job is ONLY to explain and advise in clear, plain English.++++

COMPUTED MATCH DATA (do not alter):
- Final score: {score_data['final_score']}/100  ({score_data['score_label']})
- Skills matched: {score_data['fraction']}
- Matched skills: {', '.join(set_data['matched']) or 'none'}
- Missing skills: {', '.join(set_data['missing']) or 'none'}
- Extra skills (not required but notable): {', '.join(set_data['extra'][:5]) or 'none'}

Return ONLY valid JSON, no markdown, no preamble:
{{
    "verdict": "one sentence — what does this score actually mean for the candidate",
    "summary": "2–3 sentences — why this score, which matched skills matter most, which missing ones hurt most",
    "recommendations": [ 
        "specific action targeting the most critical missing skill",
        "specific action for the second gap",
        "one quick win the candidate can do this week"
    ]
}}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,  
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
       
        return {
            "verdict": "Analysis complete.",
            "summary": raw[:300],
            "recommendations": []
        }

def analyze_match(resume_text: str, jd_input: str, api_key: str) -> dict:
   
    client = Groq(api_key=api_key)

    with ThreadPoolExecutor(max_workers=2) as executor:
     future_resume = executor.submit(extract_skills_via_llm, resume_text, client)
     future_jd = executor.submit(extract_skills_via_llm, jd_input, client)
     resume_skills = future_resume.result()
     jd_skills = future_jd.result()

    set_data = compute_set_match(resume_skills, jd_skills)

    semantic = compute_semantic_score(resume_skills, jd_skills)

    score_data = compute_final_score(set_data, jd_skills, semantic)

    verdict_data = generate_verdict(score_data, set_data, client)

    return {
        "match_score":      score_data["final_score"],
        "matching_skills":  set_data["matched"],
        "missing_skills":   set_data["missing"],
        "verdict":          verdict_data["verdict"],

        "summary":          verdict_data["summary"],
        "recommendations":  verdict_data["recommendations"],
        "score_label":      score_data["score_label"],
        "score_breakdown": {
            "fraction":        score_data["fraction"],
            "exact_match_pct": score_data["exact_rate_pct"],
            "semantic_pct":    score_data["semantic_score"],
        },
        "skills_detail": {
            "resume_skills": sorted(resume_skills),
            "jd_skills":     sorted(jd_skills),
            "extra_skills":  set_data["extra"],
        }
    }
