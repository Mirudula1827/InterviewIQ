import { Check, X } from "lucide-react";

export default function SkillTag({ label, variant = "neutral" }) {
  const variants = {
    match: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    missing: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    neutral: "border-border bg-surface-hover text-muted",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {variant === "match" && <Check size={12} strokeWidth={2.5} />}
      {variant === "missing" && <X size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
}
