import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";

export default function AudioRecorder({
  onTranscriptionComplete,
  onTranscriptionError,
  onStateChange,
  autoStart,
  disabled,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Web Audio refs for silence detection
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordingActiveRef = useRef(false);

  // Handle auto-starting/stopping recording
  useEffect(() => {
    if (autoStart && !disabled) {
      if (!isRecording && !isTranscribing) {
        startRecording();
      }
    } else {
      if (isRecording) {
        stopRecording();
      }
    }
  }, [autoStart, disabled]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, []);

  const stopTracks = () => {
    recordingActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
          const errMsg = "No audio data recorded.";
          setError(errMsg);
          if (onTranscriptionError) onTranscriptionError(errMsg);
          if (onStateChange) onStateChange("idle");
          return;
        }

        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const extension = mimeType.split(";")[0].split("/")[1] || "webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          const errMsg = "Audio recording was empty.";
          setError(errMsg);
          if (onTranscriptionError) onTranscriptionError(errMsg);
          if (onStateChange) onStateChange("idle");
          return;
        }

        await sendAudioToBackend(audioBlob, extension);
      };

      // Set VAD (Voice Activity Detection) parameters
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeechTime = Date.now();
      let hasSpoken = false;
      const silenceDuration = 3000; // Stop after 3 seconds of silence
      const initialSpeechTimeout = 10000; // Timeout after 10 seconds if no speaking starts
      const startTime = Date.now();

      recordingActiveRef.current = true;

      const checkAudio = () => {
        if (!recordingActiveRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / bufferLength;

        // Threshold of volume representing active speaking (calibrated to be more sensitive)
        const threshold = 8;

        if (averageVolume > threshold) {
          hasSpoken = true;
          lastSpeechTime = Date.now();
        }

        const now = Date.now();
        if (!hasSpoken) {
          // Trigger timeout if candidate remains completely silent for 10 seconds
          if (now - startTime > initialSpeechTimeout) {
            console.warn("Silence timeout: Candidate did not start speaking.");
            stopTracks();
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
            setIsRecording(false);
            const errMsg = "No speech detected. Please speak into your microphone.";
            setError(errMsg);
            if (onTranscriptionError) onTranscriptionError(errMsg);
            if (onStateChange) onStateChange("idle");
            return;
          }
        } else {
          // If speech is detected, stop recording 2.5s after they finish talking
          if (now - lastSpeechTime > silenceDuration) {
            console.log("Silence VAD: Automatically stopping recording.");
            stopRecording();
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudio);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      if (onStateChange) onStateChange("listening");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      animationFrameRef.current = requestAnimationFrame(checkAudio);

    } catch (err) {
      console.error("Microphone access error:", err);
      let errMsg = "Could not access microphone.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Microphone permission denied.";
      }
      setError(errMsg);
      if (onTranscriptionError) onTranscriptionError(errMsg);
      if (onStateChange) onStateChange("idle");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recordingActiveRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping media recorder:", err);
      }
    }
    stopTracks();
    setIsRecording(false);
  };

  const sendAudioToBackend = async (blob, extension) => {
    setIsTranscribing(true);
    if (onStateChange) onStateChange("transcribing");
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
        const errMsg = "No transcription returned from server.";
        setError(errMsg);
        if (onTranscriptionError) onTranscriptionError(errMsg);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      const errMsg = err.response?.data?.detail || "Failed to transcribe audio.";
      setError(errMsg);
      if (onTranscriptionError) onTranscriptionError(errMsg);
    } finally {
      setIsTranscribing(false);
      if (onStateChange) onStateChange("idle");
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
