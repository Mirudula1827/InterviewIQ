# match_analyzer.py

import json
import re
from groq import Groq
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ─────────────────────────────────────────────
# STEP 1 & 2 — LLM extracts skills from text
# Same function used for both resume and JD
# ─────────────────────────────────────────────

def extract_skills_via_llm(text: str, client: Groq) -> list[str]:
    """
    Ask Groq to pull skills out of any text blob.
    Returns a list of lowercase strings.
    LLM does ONE job here: read messy text, find skills.
    It does NOT score or compare anything.
    """
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
        temperature=0.0,   # deterministic — same text → same skills every time
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if present (```json ... ```)
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

    try:
        skills = json.loads(raw)
        # Normalise: lowercase, strip whitespace, deduplicate
        return list({s.lower().strip() for s in skills if isinstance(s, str)})
    except json.JSONDecodeError:
        # Fallback: pull anything in quotes
        return [m.lower() for m in re.findall(r'"([^"]+)"', raw)]


# ─────────────────────────────────────────────
# STEP 3 — Python set operations (no AI)
# Matched / missing computed deterministically
# ─────────────────────────────────────────────

def compute_set_match(resume_skills: list, jd_skills: list) -> dict:
    """
    Pure Python. Same inputs → identical output every single run.
    """
    resume_set = set(resume_skills)
    jd_set     = set(jd_skills)

    matched = sorted(resume_set & jd_set)           # skills in both
    missing = sorted(jd_set - resume_set)           # JD wants, resume lacks
    extra   = sorted(resume_set - jd_set)           # bonus skills not in JD

    return {
        "matched": matched,
        "missing": missing,
        "extra":   extra,
    }


# ─────────────────────────────────────────────
# STEP 4 — Semantic similarity (TF-IDF cosine)
# Catches "ML" vs "machine learning", synonyms
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# STEP 5 — Final score (pure math, no AI)
# Weighted blend: set match 70% + semantic 30%
# ─────────────────────────────────────────────

def compute_final_score(set_data: dict, jd_skills: list, semantic: float) -> dict:
    """
    Combines exact match rate and semantic similarity into one score.
    Weights are easy to tune — change the numbers, nothing else breaks.
    """
    total_jd = len(jd_skills)

    # Exact match rate: how many JD skills the resume covers exactly
    exact_rate = len(set_data["matched"]) / total_jd if total_jd > 0 else 0.0

    # Weighted blend
    EXACT_WEIGHT    = 0.70
    SEMANTIC_WEIGHT = 0.30
    raw_score = (exact_rate * EXACT_WEIGHT) + (semantic * SEMANTIC_WEIGHT)

    final = round(raw_score * 100)   # 0–100 integer, same every run

    # Deterministic label — if/elif, never LLM
    if final >= 80:   label = "Strong match"
    elif final >= 60: label = "Good match"
    elif final >= 40: label = "Partial match"
    else:             label = "Weak match"

    return {
        "final_score":    final,                          # e.g. 74
        "score_label":    label,                          # e.g. "Good match"
        "exact_rate_pct": round(exact_rate * 100),        # e.g. 68
        "semantic_score": round(semantic * 100),          # e.g. 91
        "fraction":       f"{len(set_data['matched'])}/{total_jd}",  # e.g. "9/13"
    }


# ─────────────────────────────────────────────
# STEP 6 — LLM verdict (reasoning only)
# Groq explains the data Python already computed
# It never sees raw resume/JD — only the diff
# ─────────────────────────────────────────────

def generate_verdict(score_data: dict, set_data: dict, client: Groq) -> dict:
    """
    Groq's ONLY job here: write human-readable reasoning around real numbers.
    It cannot change the score. It cannot invent skill names.
    """
    prompt = f"""You are a career coach reviewing a resume–job match analysis.
The numbers below were computed by code — do NOT change them.
Your job is ONLY to explain and advise in clear, plain English.

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
        temperature=0.3,   # slight creativity for natural language, not for facts
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Safe fallback — never crash the whole pipeline over formatting
        return {
            "verdict": "Analysis complete.",
            "summary": raw[:300],
            "recommendations": []
        }


# ─────────────────────────────────────────────
# PUBLIC FUNCTION — drop-in replacement for
# your existing analyze_match()
# ─────────────────────────────────────────────

def analyze_match(resume_text: str, jd_input: str, api_key: str) -> dict:
    """
    Pipeline:
    Resume text  ──┐
                   ├─ LLM extracts skills
    JD text      ──┘
                   │
                   ├─ Python set ops  (matched / missing)
                   ├─ TF-IDF cosine   (semantic similarity)
                   ├─ Weighted blend  (final score — deterministic)
                   └─ LLM verdict     (explains the computed data)
    """
    client = Groq(api_key=api_key)

    # Steps 1 & 2: extract skills (LLM reads messy text)
    resume_skills = extract_skills_via_llm(resume_text, client)
    jd_skills     = extract_skills_via_llm(jd_input,   client)

    # Step 3: exact match (Python set ops)
    set_data = compute_set_match(resume_skills, jd_skills)

    # Step 4: semantic similarity (TF-IDF)
    semantic = compute_semantic_score(resume_skills, jd_skills)

    # Step 5: final score (weighted math)
    score_data = compute_final_score(set_data, jd_skills, semantic)

    # Step 6: verdict (LLM explains, never recalculates)
    verdict_data = generate_verdict(score_data, set_data, client)

    # Assemble final response — same shape your old code returned
    # plus richer breakdown data
    return {
        # Core fields (same keys as before — nothing breaks downstream)
        "match_score":      score_data["final_score"],
        "matching_skills":  set_data["matched"],
        "missing_skills":   set_data["missing"],
        "verdict":          verdict_data["verdict"],

        # New fields
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
