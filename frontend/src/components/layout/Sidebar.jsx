import { Sparkles, PanelLeftClose, PanelLeft } from "lucide-react"
import NavItem from "./NavItem"
import { navItems } from "../../lib/navigation"

function BrandMark({ collapsed }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]">
        <Sparkles size={17} strokeWidth={2.2} className="text-white" />
      </div>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          InterviewPrep <span className="text-[var(--color-accent)]">AI</span>
        </span>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggleCollapse }) {
  return (
    <aside
      className={[
        "hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-in-out md:flex",
        collapsed ? "w-[72px]" : "w-64",
      ].join(" ")}
    >
      <div
        className={`flex h-16 items-center border-b border-border-subtle px-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <BrandMark collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-faint">
            Menu
          </p>
        )}
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted outline-none transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
