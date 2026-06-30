import { NavLink } from "react-router-dom"

export default function NavItem({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
            : "text-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]/60 hover:text-[var(--color-foreground)]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Active left-bar indicator */}
          <span
            aria-hidden="true"
            className={[
              "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-all duration-200",
              isActive
                ? "opacity-100 shadow-[0_0_8px_rgba(20,241,178,0.7)]"
                : "opacity-0",
            ].join(" ")}
            style={{ background: isActive ? "var(--color-accent)" : "transparent" }}
          />
          <Icon
            size={18}
            strokeWidth={isActive ? 2.2 : 1.8}
            style={{ color: isActive ? "var(--color-accent)" : undefined }}
          />
          {!collapsed && (
            <span className="truncate">{label}</span>
          )}
          {/* Teal dot on hover */}
          {!collapsed && (
            <span
              className={[
                "ml-auto h-1.5 w-1.5 rounded-full transition-all duration-200",
                isActive ? "bg-[var(--color-accent)] opacity-100" : "opacity-0 group-hover:opacity-40 bg-[var(--color-accent)]",
              ].join(" ")}
            />
          )}
        </>
      )}
    </NavLink>
  )
}
