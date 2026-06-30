import { CheckCircle, Lightbulb, TrendingUp } from "lucide-react";
import MetricRow from "../layout/MetricRow";

export default function FinalScreen({ result, onRestart }) {
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
        className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors cursor-pointer"
      >
        Start new interview
      </button>
    </div>
  );
}
