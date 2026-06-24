import PageContainer from "./PageContainer";

export default function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface">
          <Icon size={24} className="text-[var(--color-accent)]" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted text-pretty">
          {description}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          Coming Soon
        </span>
      </div>
    </PageContainer>
  );
}
