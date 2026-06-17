import streamlit as st
from dotenv import load_dotenv
import os
from services.resume_parser import extract_resume_text
from services.question_generator import generate_questions
from services.match_analyzer import analyze_match
from services.speech_to_text import transcribe_audio
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
    st.success(" Resume uploaded!")
    with st.expander("View extracted resume text"):
        st.text(resume_text)

# --- JD Input ---
st.header("2. Add Job Description")
jd_input = st.text_area("Paste the job description here", height=200)

if jd_input:
    st.success(" Job description received!")
    with st.expander("View job description"):
        st.text(jd_input)

# --- Summary ---
if resume_text and jd_input:
    st.divider()
    st.subheader(" Ready for next step")
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
            st.session_state["questions"] = generate_questions(
                resume_text,
                jd_input,
                GROQ_API_KEY
            )

    if "questions" in st.session_state:
        st.subheader("Your Interview Questions:")
        st.write(st.session_state["questions"])

# --- Speech To Text ---
if resume_text and jd_input:

    st.header("5. Speech-to-Text")

    audio_file = st.file_uploader(
        "Upload your answer recording",
        type=["wav", "mp3", "m4a"],
        key="answer_audio_uploader"
    )

    if audio_file is not None:

        st.audio(audio_file)

        if st.button("Transcribe Answer"):

            with st.spinner("Transcribing your answer..."):
                result = transcribe_audio(audio_file)

            if result["success"]:

                st.session_state["transcript"] = result["transcript"]
                st.session_state["transcript_duration"] = result["duration_sec"]

            else:
                st.error(result["error"])

    if "transcript" in st.session_state:

        st.success(
            f"Transcribed ({st.session_state['transcript_duration']}s of audio)"
        )

        st.text_area(
            "Transcript",
            value=st.session_state["transcript"],
            height=200,
            disabled=True
        )

# --- Match Score ---
if resume_text and jd_input:
    st.header("4. Resume–JD Match Score")

    if st.button("Analyze Match Score"):
        with st.spinner("Analyzing your resume against the job description..."):
            try:
                st.session_state["match_data"] = analyze_match(
                    resume_text,
                    jd_input,
                    GROQ_API_KEY
                )
            except Exception as e:
                st.error(f"Could not parse response: {e}")

    if "match_data" in st.session_state:

        data = st.session_state["match_data"]

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
            st.subheader("Matching Skills")
            for skill in data["matching_skills"]:
                st.write(f"• {skill}")

        with col2:
            st.subheader(" Missing Skills")
            for skill in data["missing_skills"]:
                st.write(f"• {skill}")

        st.info(f"**Verdict:** {data['verdict']}")