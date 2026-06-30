export default function MetricRow({ label, score, note }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 8
      ? { bar: "#22C55E", glow: "rgba(34,197,94,0.35)" }
      : score >= 5
      ? { bar: "#F59E0B", glow: "rgba(245,158,11,0.35)" }
      : { bar: "#EF4444", glow: "rgba(239,68,68,0.35)" };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-foreground)]">{label}</span>
        <span
          className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded"
          style={{ color: color.bar, background: `${color.glow}` }}
        >
          {score.toFixed(1)}/10
        </span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color.bar}, ${color.bar}aa)`,
            boxShadow: `0 0 8px ${color.glow}`,
          }}
        />
      </div>
      {note && <p className="text-[11px] text-[var(--color-faint)] leading-relaxed">{note}</p>}
    </div>
  );
}
