import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Send,
  CheckCircle,
  Lightbulb,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import api from "../lib/api";

// ── Metric row ────────────────────────────────────────────────────────────────
function MetricRow({ label, score, note }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs font-semibold text-muted">
          {score.toFixed(1)} / 10
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && <p className="text-xs text-faint leading-relaxed">{note}</p>}
    </div>
  );
}

// ── Final report screen ───────────────────────────────────────────────────────
function FinalScreen({ result, onRestart }) {
  const score = result.overall_score ?? 0;
  const pct = Math.round(score * 10);
  const scoreColor =
    score >= 8
      ? "text-green-400"
      : score >= 5
        ? "text-yellow-400"
        : "text-red-400";

  const metrics = result.metrics ?? {};

  return (
    <div className="mx-auto max-w-xl w-full py-10 space-y-6">
      {/* Score header */}
      <div className="rounded-xl border border-border bg-surface p-6 text-center space-y-1">
        <p className="text-xs font-medium text-muted uppercase tracking-widest">
          Interviewee Performance Summary
        </p>
        <p className={`text-5xl font-bold mt-2 ${scoreColor}`}>{pct}%</p>
        <p className="text-sm text-muted">
          {score.toFixed(1)} / 10 overall score
        </p>
        <p className="text-xs text-muted mt-1">
          {result.questions_answered} questions answered
        </p>
      </div>

      {/* Hiring recommendation */}
      {result.hiring_recommendation && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-purple-400 mb-1 uppercase tracking-wide">
            Hiring Recommendation
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {result.hiring_recommendation}
          </p>
        </div>
      )}

      {/* Core metrics */}
      {Object.keys(metrics).length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Core Evaluation Metrics
            </p>
          </div>
          <MetricRow
            label="Technical Knowledge"
            score={metrics.technical_knowledge?.score ?? 0}
            note={metrics.technical_knowledge?.note}
          />
          <MetricRow
            label="Problem Solving & Architecture"
            score={metrics.problem_solving?.score ?? 0}
            note={metrics.problem_solving?.note}
          />
          <MetricRow
            label="Communication"
            score={metrics.communication?.score ?? 0}
            note={metrics.communication?.note}
          />
        </div>
      )}

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
          <p className="text-xs font-semibold text-green-400 flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle size={12} /> Strengths
          </p>
          {result.strengths.map((s, i) => (
            <p key={i} className="text-xs text-muted pl-4 leading-relaxed">
              • {s}
            </p>
          ))}
        </div>
      )}

      {/* Weaknesses */}
      {result.weaknesses?.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">
            Weaknesses & Gaps
          </p>
          {result.weaknesses.map((w, i) => (
            <p key={i} className="text-xs text-muted pl-4 leading-relaxed">
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1 uppercase tracking-wide px-1">
            <Lightbulb size={12} /> Direct Suggestions
          </p>
          {result.suggestions.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-surface p-3 flex gap-2"
            >
              <Lightbulb
                size={13}
                className="text-yellow-400 mt-0.5 shrink-0"
              />
              <p className="text-xs text-muted leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
      >
        Start new interview
      </button>
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────────────────────────
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

// ── Phases ────────────────────────────────────────────────────────────────────
const PHASE = {
  LOADING: "loading",
  ASKING: "asking",
  EVALUATING: "evaluating",
  DONE: "done",
  ERROR: "error",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveInterview() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [finalResult, setFinalResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef(null);
  const MAX_QUESTIONS = 8;

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (phase === PHASE.ASKING && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, question]);

  async function startSession() {
    setPhase(PHASE.LOADING);

    // Use pre-started session if coming from NewInterview page
    const preId = localStorage.getItem("interview_session_id");
    const preQ = localStorage.getItem("interview_first_question");
    if (preId && preQ) {
      setSessionId(preId);
      setQuestion(preQ);
      setQuestionNumber(1);
      setPhase(PHASE.ASKING);
      localStorage.removeItem("interview_session_id");
      localStorage.removeItem("interview_first_question");
      return;
    }

    const resumeText = localStorage.getItem("resume_text");
    const jdText = localStorage.getItem("jd_text");
    if (!resumeText || !jdText) {
      setErrorMsg(
        "No resume or job description found. Go back and complete setup.",
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
      setAnswer("");

      if (data.interview_completed) {
        setFinalResult(data);
        setPhase(PHASE.DONE);
      } else {
        // AI silently evaluated — just show next question
        setQuestion(data.next_question);
        setQuestionNumber(data.question_number);
        setPhase(PHASE.ASKING);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Try again.");
      setPhase(PHASE.ERROR);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitAnswer();
  }

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Error ──────────────────────────────────────────────────────────────────
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

  // ── Done ───────────────────────────────────────────────────────────────────
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

  // ── Active interview ───────────────────────────────────────────────────────
  return (
    <PageContainer>
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
        {/* AI question */}
        <div className="rounded-xl border border-purple-500/20 bg-surface p-5 sm:p-6">
          <div className="mb-3">
            <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400">
              Q{questionNumber} of {MAX_QUESTIONS}
            </span>
          </div>
          <p className="text-base leading-relaxed text-foreground">
            {question}
          </p>
        </div>

        {/* Answer input */}
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
                  <Loader2 size={14} className="animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Send size={14} /> Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
