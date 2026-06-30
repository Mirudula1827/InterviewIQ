import { ListChecks, Loader2 } from "lucide-react";
import QuestionCard from "./QuestionCard";

export default function QuestionList({ questions, loading }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks size={18} className="text-(--color-accent)" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Generated Interview Questions
        </h2>
        {!loading && questions.length > 0 && (
          <span className="ml-auto rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-faint">
            {questions.length} questions
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background py-12 text-center">
          <Loader2 size={22} className="animate-spin text-(--color-accent)" />
          <p className="text-sm text-muted">Generating tailored questions…</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No questions yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-faint">
            Upload your resume and add a job description to generate tailored
            interview questions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, i) => (
            <QuestionCard key={i} number={i + 1} question={question} />
          ))}
        </div>
      )}
    </section>
  );
}
