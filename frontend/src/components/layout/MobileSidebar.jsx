import { useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import NavItem from "./NavItem"
import { navItems } from "../../lib/navigation"

export default function MobileSidebar({ open, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]">
              <Sparkles size={17} strokeWidth={2.2} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              InterviewPrep <span className="text-[var(--color-accent)]">AI</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              onClick={onClose}
            />
          ))}
        </nav>
      </aside>
    </div>
  )
}
