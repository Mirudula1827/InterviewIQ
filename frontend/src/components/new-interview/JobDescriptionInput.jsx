import { Briefcase, Paperclip, Eraser } from "lucide-react"

const MAX_CHARS = 5000

export default function JobDescriptionInput({ value, onChange }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Job Description
          </h2>
        </div>
        <span className="text-xs tabular-nums text-faint">
          {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      <textarea
        value={value}
        maxLength={MAX_CHARS}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here…"
        rows={9}
        className="w-full resize-y rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-faint hover:border-[var(--color-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <Paperclip size={14} />
          Upload JD as PDF
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={!value}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser size={14} />
          Clear
        </button>
      </div>
    </section>
  )
}
