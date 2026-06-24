import { NavLink } from "react-router-dom"

export default function NavItem({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-[var(--color-accent-soft)] text-foreground"
            : "text-muted hover:bg-surface-hover hover:text-foreground",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={[
              "absolute left-0 h-5 w-0.5 rounded-r-full bg-[var(--color-accent)] transition-opacity duration-150",
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
          <Icon
            size={18}
            strokeWidth={2}
            className={isActive ? "text-[var(--color-accent)]" : ""}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}
