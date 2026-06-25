import { Rocket, RefreshCw, Gauge, ListChecks, FileCheck2 } from "lucide-react";

function Recap({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-soft)">
        <Icon size={16} className="text-(--color-accent)" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-faint">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function InterviewReadinessCard({
  score,
  questionCount,
  resumeReady,
  onRegenerate,
  onStart,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-(--color-accent)/25 bg-surface">
      <div className="border-b border-border bg-(--color-accent-soft) px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-(--color-accent)" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            You&apos;re ready to begin
          </h2>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
          Your resume and target role are analyzed. Start an adaptive interview
          that adjusts difficulty based on your answers.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Recap icon={Gauge} label="Match Score" value={`${score}%`} />
          <Recap
            icon={ListChecks}
            label="Questions"
            value={`${questionCount} prepared`}
          />
          <Recap
            icon={FileCheck2}
            label="Resume"
            value={resumeReady ? "Analyzed" : "Pending"}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-(--color-accent-hover) focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Rocket size={16} />
            Start Adaptive Interview
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--color-accent)"
          >
            <RefreshCw size={16} />
            Regenerate Questions
          </button>
        </div>
      </div>
    </section>
  );
}
