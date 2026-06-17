import os
import tempfile
import whisper
import streamlit as st

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a"}
MAX_FILE_SIZE_MB = 25


@st.cache_resource
def load_whisper_model():
    """
    Cached across Streamlit reruns — loads Whisper tiny exactly once
    per session, not on every button click or page interaction.
    """
    return whisper.load_model("base")


def validate_audio_file(uploaded_file) -> tuple[bool, str]:
    """
    Pure validation, no AI. Returns (is_valid, error_message).
    """
    if uploaded_file is None:
        return False, "No file uploaded."

    ext = os.path.splitext(uploaded_file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Use .wav, .mp3, or .m4a."

    size_mb = uploaded_file.size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large ({size_mb:.1f}MB). Max is {MAX_FILE_SIZE_MB}MB."

    return True, ""


def transcribe_audio(uploaded_file) -> dict:
    """
    Takes a Streamlit UploadedFile, returns:
    {
        "success": bool,
        "transcript": str,
        "duration_sec": float,
        "error": str or None
    }
    Never raises — always returns a result dict so the UI layer
    can display success or failure without a try/except of its own.
    """
    is_valid, error_msg = validate_audio_file(uploaded_file)
    if not is_valid:
        return {"success": False, "transcript": "", "duration_sec": 0.0, "error": error_msg}

    tmp_path = None
    try:
       
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(uploaded_file.getvalue())
            tmp_path = tmp.name

        model = load_whisper_model()
        result = model.transcribe(tmp_path)

        transcript = result.get("text", "").strip()
        segments = result.get("segments", [])
        duration = segments[-1]["end"] if segments else 0.0

        if not transcript:
            return {
                "success": False,
                "transcript": "",
                "duration_sec": duration,
                "error": "No speech detected in the audio. Try re-recording with clearer audio."
            }

        return {
            "success": True,
            "transcript": transcript,
            "duration_sec": round(duration, 1),
            "error": None
        }

    except Exception as e:
       
        return {
            "success": False,
            "transcript": "",
            "duration_sec": 0.0,
            "error": f"Transcription failed: {str(e)}"
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
