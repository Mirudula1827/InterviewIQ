import json
import re
import difflib
from groq import Groq
from concurrent.futures import ThreadPoolExecutor

import numpy as np

# Load sentence transformer model globally (once at application startup)
model = None
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Failed to load sentence-transformers: {e}")

# Canonical dictionary for common variations
SYNONYMS = {
    "react": ["react", "reactjs", "react.js", "react js"],
    "react native": ["react native", "react-native"],
    "node.js": ["node.js", "nodejs", "node js", "node"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "javascript": ["javascript", "js", "es6", "es5", "ecmascript"],
    "typescript": ["typescript", "ts"],
    "rest api": ["rest api", "restapis", "restful api", "restful apis", "rest apis", "rest", "restful"],
    "postgresql": ["postgresql", "postgres", "postgre"],
    "mongodb": ["mongodb", "mongo"],
    "aws": ["aws", "amazon web services", "amazon web service"],
    "gcp": ["gcp", "google cloud platform", "google cloud"],
    "docker": ["docker", "docker containers", "docker container"],
    "kubernetes": ["kubernetes", "k8s"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
    "git": ["git", "github", "gitlab"],
    "vue.js": ["vue.js", "vuejs", "vue js", "vue"],
    "angular": ["angular", "angularjs", "angular.js"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl"],
    "artificial intelligence": ["artificial intelligence", "ai"],
    "natural language processing": ["natural language processing", "nlp"],
    "large language models": ["large language models", "llms", "llm"],
    "c#": ["c#", "c-sharp", "csharp", ".net"],
    "c++": ["c++", "cpp"],
    "python": ["python", "python3"],
    "go": ["go", "golang", "go lang"],
    "next.js": ["next.js", "nextjs", "next js", "next"],
    "tailwind css": ["tailwind css", "tailwindcss", "tailwind"],
    "sass": ["sass", "scss"],
    "sql server": ["sql server", "mssql", "ms sql"],
    "mysql": ["mysql"],
    "oracle": ["oracle", "oracle db", "oracle database"],
    "sqlite": ["sqlite"],
    "redis": ["redis"],
    "graphql": ["graphql"],
    "microservices": ["microservices", "micro-services"],
    "agile": ["agile", "scrum", "agile/scrum"]
}

# Reverse lookup for easy canonicalization
CANONICAL_MAP = {}
for canonical, variations in SYNONYMS.items():
    for var in variations:
        CANONICAL_MAP[var] = canonical


def normalize_skill(skill: str) -> str:
    """
    Standardize skill names, handling lowercase, punctuation, and synonyms.
    """
    s = skill.lower().strip()
    s = re.sub(r"^['\"-]+|['\"-]+$", "", s)
    if s in CANONICAL_MAP:
        return CANONICAL_MAP[s]
    # Remove punctuation except special ones like +, #, ., -
    s = re.sub(r"[^\w\s\+\#\.\-]", "", s)
    s = s.strip()
    return CANONICAL_MAP.get(s, s)


# LLM extracts skills from text
def extract_skills_via_llm(text: str, client: Groq) -> list[str]:
    prompt = """Extract all technical and professional skills that are EXPLICITLY mentioned in the text.

Rules:
- DO NOT infer, assume, or extrapolate any skills that are not directly and explicitly stated in the text. (For example, if the text mentions "web development" but doesn't mention "HTML" or "CSS", DO NOT extract HTML or CSS).
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


SEMANTIC_RELATIONS = {
    "machine learning": {"xgboost", "logistic regression", "shap", "random forest", "svm", "scikit-learn", "tensorflow", "pytorch", "keras", "deep learning", "neural networks", "linear regression", "gradient boosting", "ml"},
    "git": {"github", "gitlab", "bitbucket"},
    "rest api": {"rest api development", "api development", "restful api development", "restful api", "rest apis", "restful apis"},
    "system design": {"software architecture", "microservices", "distributed systems", "system architecture"}
}

def compute_hybrid_match(resume_skills: list[str], jd_skills: list[str]) -> dict:
    """
    Computes matches using exact matching after normalization,
    and fallback fuzzy matching (difflib SequenceMatcher) only for minor variations,
    and fallback semantic similarity (using sentence transformers + taxonomy rules).
    """
    matched_skills = []
    missing_skills = []
    matched_pairs = []
    extra_skills = []

    # Pre-normalize resume skills
    normalized_resume = {}
    for r_skill in resume_skills:
        norm = normalize_skill(r_skill)
        normalized_resume[norm] = r_skill

    # Pre-encode all resume skills and jd skills with prefix context
    resume_embeddings = {}
    jd_embeddings = {}
    if model is not None and resume_skills and jd_skills:
        try:
            r_contexts = [f"technical skill: {s}" for s in resume_skills]
            r_embeddings_list = model.encode(r_contexts, show_progress_bar=False)
            for r_skill, emb in zip(resume_skills, r_embeddings_list):
                resume_embeddings[r_skill] = emb
            
            j_contexts = [f"technical skill: {s}" for s in jd_skills]
            j_embeddings_list = model.encode(j_contexts, show_progress_bar=False)
            for jd_skill, emb in zip(jd_skills, j_embeddings_list):
                jd_embeddings[jd_skill] = emb
        except Exception as e:
            print(f"Embedding encoding failed: {e}")

    # Match each JD skill
    for jd_skill in jd_skills:
        norm_jd = normalize_skill(jd_skill)
        
        # 1. Exact match after normalization
        if norm_jd in normalized_resume:
            matched_skills.append(jd_skill)
            matched_pairs.append({
                "resume_skill": normalized_resume[norm_jd],
                "jd_skill": jd_skill,
                "similarity": 1.0,
                "match_type": "exact"
            })
            continue

        # 2. Fuzzy match fallback for minor variations (threshold >= 0.85)
        best_ratio = 0.0
        best_r_skill = None
        for norm_r, r_skill in normalized_resume.items():
            ratio = difflib.SequenceMatcher(None, norm_jd, norm_r).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_r_skill = r_skill

        if best_ratio >= 0.85 and best_r_skill:
            matched_skills.append(jd_skill)
            matched_pairs.append({
                "resume_skill": best_r_skill,
                "jd_skill": jd_skill,
                "similarity": round(best_ratio, 2),
                "match_type": "fuzzy"
            })
            continue

        # 3. Semantic similarity match fallback (taxonomy rules first, then embeddings)
        best_sim = 0.0
        best_sim_r_skill = None
        
        # Check rule-based taxonomy relationships first
        for norm_r, r_skill in normalized_resume.items():
            if norm_jd in SEMANTIC_RELATIONS and norm_r in SEMANTIC_RELATIONS[norm_jd]:
                best_sim = 0.88
                best_sim_r_skill = r_skill
                break
            if norm_r in SEMANTIC_RELATIONS and norm_jd in SEMANTIC_RELATIONS[norm_r]:
                best_sim = 0.88
                best_sim_r_skill = r_skill
                break

        # Fall back to sentence-transformers context similarity
        if best_sim == 0.0 and model is not None and jd_skill in jd_embeddings:
            emb_jd = jd_embeddings[jd_skill]
            norm_jd_emb = np.linalg.norm(emb_jd)
            if norm_jd_emb > 0:
                for r_skill in resume_skills:
                    if r_skill in resume_embeddings:
                        emb_r = resume_embeddings[r_skill]
                        norm_r_emb = np.linalg.norm(emb_r)
                        if norm_r_emb > 0:
                            sim = np.dot(emb_jd, emb_r) / (norm_jd_emb * norm_r_emb)
                            # Threshold for context semantic similarity is 0.78
                            if sim >= 0.78 and float(sim) > best_sim:
                                best_sim = float(sim)
                                best_sim_r_skill = r_skill

        if best_sim >= 0.78 and best_sim_r_skill:
            matched_skills.append(jd_skill)
            matched_pairs.append({
                "resume_skill": best_sim_r_skill,
                "jd_skill": jd_skill,
                "similarity": round(best_sim, 2),
                "match_type": "semantic"
            })
        else:
            missing_skills.append(jd_skill)

    # Compute extra skills
    matched_resume_set = {p["resume_skill"] for p in matched_pairs}
    for r_skill in resume_skills:
        if r_skill not in matched_resume_set:
            extra_skills.append(r_skill)

    return {
        "matched": sorted(matched_skills),
        "missing": sorted(missing_skills),
        "extra": sorted(extra_skills),
        "matched_pairs": matched_pairs
    }


def compute_final_score(set_data: dict, jd_skills: list) -> dict:
    """
    Deterministic score calculation performed in Python.
    Calculates average match score across all target JD skills.
    """
    total_jd = len(jd_skills)
    if total_jd == 0:
        return {
            "final_score": 0,
            "score_label": "No JD Skills",
            "exact_rate_pct": 0,
            "fraction": "0/0"
        }

    # Sum of match similarity scores
    score_sum = sum(p["similarity"] for p in set_data["matched_pairs"])
    exact_count = sum(1 for p in set_data["matched_pairs"] if p["match_type"] == "exact")

    average_match_score = score_sum / total_jd
    final = round(average_match_score * 100)

    if final >= 80:
        label = "Strong match"
    elif final >= 60:
        label = "Good match"
    elif final >= 40:
        label = "Partial match"
    else:
        label = "Weak match"

    return {
        "final_score": final,
        "score_label": label,
        "exact_rate_pct": round((exact_count / total_jd) * 100),
        "fraction": f"{len(set_data['matched'])}/{total_jd}",
    }


def generate_verdict(score_data: dict, set_data: dict, client: Groq) -> dict:
    """
    LLM is used solely to generate the natural-language feedback based on computed data.
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

    set_data = compute_hybrid_match(resume_skills, jd_skills)
    score_data = compute_final_score(set_data, jd_skills)
    verdict_data = generate_verdict(score_data, set_data, client)

    return {
        "match_score": score_data["final_score"],
        "matching_skills": set_data["matched"],
        "missing_skills": set_data["missing"],
        "matched_pairs": set_data["matched_pairs"],
        "verdict": verdict_data["verdict"],
        "summary": verdict_data["summary"],
        "recommendations": verdict_data["recommendations"],
        "score_label": score_data["score_label"],
        "score_breakdown": {
            "fraction": score_data["fraction"],
            "exact_match_pct": score_data["exact_rate_pct"],
        },
        "skills_detail": {
            "resume_skills": sorted(resume_skills),
            "jd_skills": sorted(jd_skills),
            "extra_skills": set_data["extra"],
        }
    }
