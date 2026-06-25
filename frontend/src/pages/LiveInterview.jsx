import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Send,
  CheckCircle,
  XCircle,
  Lightbulb,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import api from "../lib/api";
function ScoreBadge({ score }) {
  const color =
    score >= 8
      ? "text-green-400 bg-green-400/10 border-green-400/20"
      : score >= 5
        ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
        : "text-red-400 bg-red-400/10 border-red-400/20";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      <Star size={11} />
      {score}/10
    </span>
  );
}

function FeedbackCard({ feedback }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Answer feedback
        </span>
        <ScoreBadge score={feedback.score} />
      </div>

      {feedback.strengths?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-green-400 flex items-center gap-1">
            <CheckCircle size={12} /> Strengths
          </p>
          <ul className="space-y-0.5">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-xs text-muted pl-4">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.weaknesses?.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-red-400 flex items-center gap-1">
            <XCircle size={12} /> Weaknesses
          </p>
          <ul className="space-y-0.5">
            {feedback.weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-muted pl-4">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.suggestion && (
        <div className="rounded-lg bg-background border border-border p-3 flex gap-2">
          <Lightbulb size={14} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted leading-relaxed">
            {feedback.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}

function FinalScreen({ result, onRestart }) {
  const score = result.final_score;
  const color =
    score >= 8
      ? "text-green-400"
      : score >= 5
        ? "text-yellow-400"
        : "text-red-400";
  const label =
    score >= 8 ? "Excellent" : score >= 5 ? "Good effort" : "Keep practicing";

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="rounded-full border border-border bg-surface p-6">
        <span className={`text-5xl font-bold ${color}`}>{score}</span>
        <span className="text-xl text-muted">/10</span>
      </div>
      <div>
        <p className={`text-lg font-semibold ${color}`}>{label}</p>
        <p className="text-sm text-muted mt-1">
          {result.questions_answered} questions answered
        </p>
      </div>
      {result.strengths?.length > 0 && (
        <div className="text-left max-w-md w-full rounded-xl border border-border bg-surface p-5 space-y-2">
          <p className="text-xs font-medium text-green-400 flex items-center gap-1">
            <CheckCircle size={12} /> Final strengths
          </p>
          {result.strengths.map((s, i) => (
            <p key={i} className="text-xs text-muted pl-4">
              {s}
            </p>
          ))}
        </div>
      )}
      {result.suggestion && (
        <div className="max-w-md w-full rounded-lg bg-surface border border-border p-4 flex gap-2">
          <Lightbulb size={14} className="text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted leading-relaxed">
            {result.suggestion}
          </p>
        </div>
      )}
      <button
        onClick={onRestart}
        className="mt-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
      >
        Start new interview
      </button>
    </div>
  );
}

function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-4 bg-purple-500"
              : i === current
                ? "w-4 bg-purple-400"
                : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

const PHASE = {
  LOADING: "loading",
  ASKING: "asking",
  EVALUATING: "evaluating",
  FEEDBACK: "feedback",
  DONE: "done",
  ERROR: "error",
};

export default function LiveInterview() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState(PHASE.LOADING);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const textareaRef = useRef(null);
  const MAX_QUESTIONS = 8;

  // ── Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  // ── Auto-focus textarea when asking
  useEffect(() => {
    if (phase === PHASE.ASKING && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, question]);

  async function startSession() {
    setPhase(PHASE.LOADING);

    // Read resume + JD saved during NewInterview step
    const resumeText = localStorage.getItem("resume_text");
    const jdText = localStorage.getItem("jd_text");

    if (!resumeText || !jdText) {
      setErrorMsg(
        "No resume or job description found. Please go back and complete the setup step.",
      );
      setPhase(PHASE.ERROR);
      return;
    }

    try {
      const res = await api.post("/interview/start", {
        resume_text: resumeText,
        jd_text: jdText,
      });
      setSessionId(res.data.session_id);
      setQuestion(res.data.question);
      setQuestionNumber(1);
      setPhase(PHASE.ASKING);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to start interview. Please try again.");
      setPhase(PHASE.ERROR);
    }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setPhase(PHASE.EVALUATING);

    try {
      const res = await api.post("/interview/answer", {
        session_id: sessionId,
        answer: answer.trim(),
      });

      const data = res.data;
      setFeedback(data);
      setAnswer("");

      if (data.interview_completed) {
        setFinalResult(data);
        setPhase(PHASE.DONE);
      } else {
        setPhase(PHASE.FEEDBACK);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong evaluating your answer. Try again.");
      setPhase(PHASE.ERROR);
    }
  }

  function handleNextQuestion() {
    setQuestion(feedback.next_question);
    setQuestionNumber((n) => n + 1);
    setFeedback(null);
    setPhase(PHASE.ASKING);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitAnswer();
    }
  }

  if (phase === PHASE.LOADING) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 size={28} className="animate-spin text-purple-400" />
          <p className="text-sm text-muted">Starting your interview session…</p>
        </div>
      </PageContainer>
    );
  }

  if (phase === PHASE.ERROR) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-foreground font-medium">{errorMsg}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/new-interview")}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              Back to setup
            </button>
            <button
              onClick={startSession}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (phase === PHASE.DONE) {
    return (
      <PageContainer>
        <FinalScreen
          result={finalResult}
          onRestart={() => navigate("/new-interview")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
            <Mic size={13} />
            Live Interview
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Answer naturally, as you would in a real interview
          </h1>
        </div>
        <ProgressDots current={questionNumber - 1} total={MAX_QUESTIONS} />
      </header>

      <div className="space-y-4">
        {/* Question card */}
        <div className="rounded-xl border border-purple-500/20 bg-surface p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400">
              Q{questionNumber} of {MAX_QUESTIONS}
            </span>
          </div>
          <p className="text-base leading-relaxed text-foreground">
            {question}
          </p>
        </div>

        {/* Feedback (shown between questions) */}
        {phase === PHASE.FEEDBACK && feedback && (
          <>
            <FeedbackCard feedback={feedback} />
            <button
              onClick={handleNextQuestion}
              className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
            >
              Next question →
            </button>
          </>
        )}

        {/* Answer input (shown when asking) */}
        {(phase === PHASE.ASKING || phase === PHASE.EVALUATING) && (
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={phase === PHASE.EVALUATING}
              placeholder="Type your answer here… (Ctrl+Enter to submit)"
              rows={6}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-faint outline-none leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-faint">
                {answer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || phase === PHASE.EVALUATING}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {phase === PHASE.EVALUATING ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Evaluating…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit answer
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
