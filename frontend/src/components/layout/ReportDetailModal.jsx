import { X, CheckCircle, Lightbulb, TrendingUp, Calendar, Clock, MessageSquare, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useState } from "react";
import MetricRow from "./MetricRow";

export default function ReportDetailModal({ isOpen, onClose, report }) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!isOpen || !report) return null;

  const score = report.overall_score ?? 0;
  const pct = Math.round(score * 10);
  const scoreColor =
    score >= 8 ? "#22C55E" : score >= 5 ? "#F59E0B" : "#EF4444";
  const scoreBg =
    score >= 8 ? "rgba(34,197,94,0.10)" : score >= 5 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)";
  const scoreGlow =
    score >= 8 ? "0 0 20px rgba(34,197,94,0.25)" : score >= 5 ? "0 0 20px rgba(245,158,11,0.25)" : "0 0 20px rgba(239,68,68,0.25)";

  const metrics = report.metrics ?? {};
  const formattedDate = report.date
    ? new Date(report.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const formatTime = (secs) => {
    if (!secs) return "0m";
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins === 0) return `${remainingSecs}s`;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(10, 14, 20, 0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17, 24, 39, 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--color-border-glass)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.60), 0 0 0 1px rgba(20,241,178,0.08), 0 0 40px rgba(20,241,178,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <div>
            <h2 className="text-lg font-bold text-[var(--color-foreground)] truncate max-w-[20rem] sm:max-w-md">
              {report.role || "AI Mock Interview"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[var(--color-muted)]">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Duration: {formatTime(report.practice_time)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 outline-none transition-all text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Score + Recommendation */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Score ring */}
            <div
              className="rounded-2xl p-5 text-center flex flex-col justify-center items-center gap-2"
              style={{ background: scoreBg, border: `1px solid ${scoreColor}30`, boxShadow: scoreGlow }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Overall Score</p>
              <p className="text-5xl font-black tabular-nums" style={{ color: scoreColor, textShadow: scoreGlow }}>
                {pct}%
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {score.toFixed(1)} / 10 · {report.questions_answered} Qs
              </p>
            </div>

            {/* Hiring Rec */}
            <div
              className="md:col-span-2 rounded-2xl p-5 flex flex-col justify-center"
              style={{
                background: "rgba(20, 241, 178, 0.04)",
                border: "1px solid var(--color-border-glass)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} style={{ color: "var(--color-accent)" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
                  Hiring Recommendation
                </p>
              </div>
              <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
                {report.hiring_recommendation || "No recommendation provided."}
              </p>
            </div>
          </div>

          {/* Metrics */}
          {Object.keys(metrics).length > 0 && (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
                <TrendingUp size={14} style={{ color: "var(--color-accent)" }} />
                <p className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wide">
                  Core Evaluation Metrics
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <MetricRow
                  label="Technical Knowledge"
                  score={metrics.technical_knowledge?.score ?? 0}
                  note={metrics.technical_knowledge?.note}
                />
                <MetricRow
                  label="Problem Solving"
                  score={metrics.problem_solving?.score ?? 0}
                  note={metrics.problem_solving?.note}
                />
                <MetricRow
                  label="Communication"
                  score={metrics.communication?.score ?? 0}
                  note={metrics.communication?.note}
                />
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 md:grid-cols-2">
            {report.strengths?.length > 0 && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.20)" }}
              >
                <p className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5 uppercase tracking-wide border-b pb-2" style={{ borderColor: "rgba(34,197,94,0.15)" }}>
                  <CheckCircle size={13} /> Key Strengths
                </p>
                <div className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)] leading-relaxed pl-3 border-l-2" style={{ borderColor: "#22C55E50" }}>
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {report.weaknesses?.length > 0 && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.20)" }}
              >
                <p className="text-xs font-bold text-[#EF4444] uppercase tracking-wide border-b pb-2" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
                  Weaknesses & Gaps
                </p>
                <div className="space-y-2">
                  {report.weaknesses.map((w, i) => (
                    <p key={i} className="text-xs text-[var(--color-muted)] leading-relaxed pl-3 border-l-2" style={{ borderColor: "#EF444450" }}>
                      {w}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {report.suggestions?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#F59E0B] flex items-center gap-1.5 uppercase tracking-wide px-1">
                <Lightbulb size={13} /> Actionable Suggestions
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {report.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3.5 flex gap-2.5 items-start transition-all hover:border-[#F59E0B40]"
                    style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
                  >
                    <Lightbulb size={14} className="shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript Toggle */}
          {report.history?.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border-subtle)" }}>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider transition-colors text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  Interview Transcript ({report.history.length} Q&As)
                </span>
                {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showTranscript && (
                <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-2">
                  {report.history.map((h, i) => (
                    <div key={i} className="space-y-2 border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: "var(--color-border-subtle)" }}>
                      <div
                        className="rounded-xl p-3"
                        style={{ background: "rgba(20,241,178,0.06)", border: "1px solid rgba(20,241,178,0.12)" }}
                      >
                        <p className="text-[10px] font-bold text-[var(--color-accent)] mb-1 uppercase tracking-wider">
                          Question {i + 1}
                        </p>
                        <p className="text-xs text-[var(--color-foreground)] leading-relaxed">
                          {h.question}
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3 pl-4"
                        style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}
                      >
                        <p className="text-[10px] font-bold text-[var(--color-muted)] mb-1 uppercase tracking-wider">
                          Your Answer
                        </p>
                        <p className="text-xs text-[var(--color-muted)] leading-relaxed italic">
                          &ldquo;{h.answer}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
