import { useState, useRef, useEffect, useCallback } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSupported(true);
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text, onEndCallback) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any active speech
    window.speechSynthesis.cancel();

    // Read stored settings
    const savedSettings = JSON.parse(localStorage.getItem("interviewprep-settings") || "{}");
    const voiceEnabled = savedSettings.voiceEnabled !== false;
    const speechRate = savedSettings.speechRate || 1.0;

    if (!voiceEnabled) {
      if (onEndCallback) {
        onEndCallback();
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utteranceRef.current = utterance; // Keep reference to prevent garbage collection bug in Chrome

    // Try to load professional English voices
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    const handleEnd = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = (event) => {
      console.warn("Speech synthesis error event:", event);
      handleEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Sync state on page unload / component unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { speak, cancel, isSpeaking, supported };
}
