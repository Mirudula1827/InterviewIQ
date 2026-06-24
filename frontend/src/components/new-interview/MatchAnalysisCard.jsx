import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import SkillTag from "./SkillTag";

function ScoreRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {score}%
        </span>
        <span className="text-xs text-faint">Match</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    accent: "text-[var(--color-accent)]",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs text-faint">
        <Icon size={14} className={tones[tone]} />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function MatchAnalysisCard({ analysis }) {
  const {
    score = 0,
    matchingSkills = [],
    missingSkills = [],
    verdict = "",
    recommendations = [],
  } = analysis || {};

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Gauge size={18} className="text-(--color-accent)" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Resume Match Analysis
        </h2>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={score} />
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={CheckCircle2}
            label="Matching"
            value={matchingSkills.length}
            tone="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="Missing"
            value={missingSkills.length}
            tone="amber"
          />
          <StatCard
            icon={Gauge}
            label="Overall"
            value={`${score}%`}
            tone="accent"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Matching Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchingSkills.map((skill) => (
              <SkillTag key={skill} label={skill} variant="match" />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
            <AlertTriangle size={13} className="text-amber-400" />
            Missing Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <SkillTag key={skill} label={skill} variant="missing" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-(--color-accent)/20 bg-(--color-accent-soft) p-4">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
          <Sparkles size={13} />
          AI Verdict
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground text-pretty">
          {verdict}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
          <Lightbulb size={13} className="text-(--color-accent)" />
          Recommendations
        </h3>
        <ul className="space-y-2">
          {recommendations.map((rec) => (
            <li
              key={rec}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-accent)" />
              <span className="text-pretty">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
