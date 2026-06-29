import os
import tempfile
import whisper


ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".mp4", ".mpeg", ".opus", ".bin", ""}
MAX_FILE_SIZE_MB = 25

_model = None

def get_whisper_model():
    global _model
    if _model is None:
        _model = whisper.load_model("base")
    return _model

def validate_audio_file(filename: str, size_bytes: int) -> tuple[bool, str]:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Use standard formats like .webm, .wav, .mp3, or .m4a."

    size_mb = size_bytes / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large ({size_mb:.1f}MB). Max is {MAX_FILE_SIZE_MB}MB."

    return True, ""

def transcribe_audio(filename: str, file_bytes: bytes) -> dict:
    is_valid, error_msg = validate_audio_file(filename, len(file_bytes))
    if not is_valid:
        return {"success": False, "transcript": "", "duration_sec": 0.0, "error": error_msg}

    tmp_path = None
    try:
       
        ext = os.path.splitext(filename)[1].lower()
        if ext not in {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".mp4", ".mpeg", ".opus"}:
            ext = ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        model = get_whisper_model()
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
