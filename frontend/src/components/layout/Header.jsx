import { Menu, Search, Bell, Sun, Moon } from "lucide-react"

export default function Header({ title, onOpenMobile, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] md:hidden"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="w-44 rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-faint hover:border-[var(--color-faint)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] lg:w-64"
          />
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          className="rounded-lg p-2 text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>

        <button
          type="button"
          aria-label="User profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          JD
        </button>
      </div>
    </header>
  )
}
