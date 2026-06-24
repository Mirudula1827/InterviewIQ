import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function QuestionCard({ number, question }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(question).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-(--color-faint)">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--color-accent-soft) text-xs font-semibold text-(--color-accent)">
        {number}
      </span>
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground text-pretty">
        {question}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy question"}
        className="shrink-0 rounded-lg p-2 text-faint outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-(--color-accent)"
      >
        {copied ? (
          <Check size={15} className="text-emerald-400" />
        ) : (
          <Copy size={15} />
        )}
      </button>
    </div>
  );
}
