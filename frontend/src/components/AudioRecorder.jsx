import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";

export default function AudioRecorder({ onTranscriptionComplete, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clear timer and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setError("");
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "audio/ogg" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stopTracks();
        if (chunksRef.current.length === 0) {
          setError("No audio data recorded.");
          return;
        }

        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const extension = mimeType.split(";")[0].split("/")[1] || "webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          setError("Audio recording was empty.");
          return;
        }

        await sendAudioToBackend(audioBlob, extension);
      };

      // Start recording and collect chunks every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone permission denied.");
      } else {
        setError("Could not access microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendAudioToBackend = async (blob, extension) => {
    setIsTranscribing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", blob, `recording.${extension}`);

      const response = await api.post("/interview/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.transcript) {
        onTranscriptionComplete(response.data.transcript);
      } else {
        setError("No transcription returned from server.");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      const errMsg = err.response?.data?.detail || "Failed to transcribe audio.";
      setError(errMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        <span>Transcribing...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all cursor-pointer animate-pulse"
        >
          <Square className="h-3 w-3 fill-red-400 text-red-400" />
          <span>Stop ({formatTime(duration)})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          title="Record your answer"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-border/30 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Record Answer</span>
        </button>
        {error && (
          <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium animate-fade-in">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
