import { Cpu, PanelLeftClose, PanelLeft } from "lucide-react"
import NavItem from "./NavItem"
import { navItems } from "../../lib/navigation"

function BrandMark({ collapsed }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "var(--gradient-accent)", boxShadow: "0 0 14px rgba(20,241,178,0.35)" }}
      >
        <Cpu size={16} strokeWidth={2.5} className="text-[#0A0E14]" />
      </div>
      {!collapsed && (
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Interview<span className="text-gradient">IQ</span>
        </span>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggleCollapse }) {
  return (
    <aside
      className={[
        "hidden shrink-0 flex-col border-r transition-[width] duration-300 ease-in-out md:flex",
        "glass",
        collapsed ? "w-[72px]" : "w-64",
      ].join(" ")}
      style={{ borderColor: "var(--color-border-glass)" }}
    >
      <div
        className={`flex h-16 items-center border-b px-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <BrandMark collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {!collapsed && (
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)]">
            Navigation
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

      <div className="border-t p-3" style={{ borderColor: "var(--color-border-subtle)" }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 outline-none",
            "text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
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
