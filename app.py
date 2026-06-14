import streamlit as st
from dotenv import load_dotenv
import os
from services.resume_parser import extract_resume_text
from services.question_generator import generate_questions
from services.match_analyzer import analyze_match
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

st.set_page_config(page_title="Interview Analyzer", page_icon="🎯")
st.title("Interview Analyzer")

# --- Resume Upload ---
st.header("1. Upload Your Resume")
resume_file = st.file_uploader("Upload resume (PDF)", type=["pdf"], key="resume")

resume_text = ""
if resume_file:
    resume_text = extract_resume_text(resume_file)
    st.success("✅ Resume uploaded!")
    with st.expander("View extracted resume text"):
        st.text(resume_text)

# --- JD Input ---
st.header("2. Add Job Description")
jd_input = st.text_area("Paste the job description here", height=200)

if jd_input:
    st.success("✅ Job description received!")
    with st.expander("View job description"):
        st.text(jd_input)

# --- Summary ---
if resume_text and jd_input:
    st.divider()
    st.subheader("✅ Ready for next step")
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Resume words", len(resume_text.split()))
    with col2:
        st.metric("JD words", len(jd_input.split()))

# --- Generate Questions ---
if resume_text and jd_input:
    st.header("3. Interview Questions")

    if st.button("Generate Interview Questions"):
        with st.spinner("Generating questions..."):
            questions_text = generate_questions(jd_input, GROQ_API_KEY)
        st.subheader("Your Interview Questions:")
        st.write(questions_text)
        st.session_state["questions"] = questions_text

# --- Match Score ---
if resume_text and jd_input:
    st.header("4. Resume–JD Match Score")

    if st.button("Analyze Match Score"):
        with st.spinner("Analyzing your resume against the job description..."):
            try:
                data = analyze_match(resume_text, jd_input, GROQ_API_KEY)
                score = data["match_score"]
                if score >= 75:
                    st.success(f"Match Score: {score}%")
                elif score >= 50:
                    st.warning(f"Match Score: {score}%")
                else:
                    st.error(f"Match Score: {score}%")

                st.progress(score / 100)
                st.caption(
                f"Matched Skills: {data['score_breakdown']['fraction']}"
                )
                col1, col2 = st.columns(2)
                with col1:
                    st.subheader("✅ Matching Skills")
                    for skill in data["matching_skills"]:
                        st.write(f"• {skill}")
                with col2:
                    st.subheader("❌ Missing Skills")
                    for skill in data["missing_skills"]:
                        st.write(f"• {skill}")

                st.info(f"**Verdict:** {data['verdict']}")
                st.session_state["match_data"] = data

            except Exception as e:
                st.error(f"Could not parse response: {e}")