import { Menu, Search, Bell, Sun, Moon, Zap } from "lucide-react"

export default function Header({ title, onOpenMobile, theme, onToggleTheme }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6"
      style={{
        background: "rgba(10, 14, 20, 0.80)",
        borderColor: "var(--color-border-glass)",
        boxShadow: "0 1px 0 rgba(20, 241, 178, 0.06), 0 4px 24px rgba(0,0,0,0.25)",
      }}
    >
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 outline-none transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] text-[var(--color-muted)] md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Title with subtle gradient text */}
      <h1 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-faint)" }}
          />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search"
            className="w-44 rounded-lg py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 lg:w-56"
            style={{
              background: "rgba(17, 24, 39, 0.60)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--color-accent)";
              e.target.style.boxShadow = "0 0 0 2px var(--color-accent-soft), 0 0 12px rgba(20,241,178,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          className="rounded-lg p-2 outline-none transition-all duration-150 text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 outline-none transition-all duration-150 text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
        >
          <Bell size={18} />
          <span
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full animate-teal-pulse"
            style={{ background: "var(--color-accent)" }}
          />
        </button>

        {/* Avatar */}
        <button
          type="button"
          aria-label="User profile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[#0A0E14] outline-none transition-all hover:scale-105 hover:shadow-lg"
          style={{
            background: "var(--gradient-accent)",
            boxShadow: "0 0 14px rgba(20,241,178,0.30)",
          }}
        >
          <Zap size={15} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  )
}
