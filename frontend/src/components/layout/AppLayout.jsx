import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import MobileSidebar from "./MobileSidebar"
import Header from "./Header"
import { getPageTitle } from "../../lib/navigation"
import { useTheme } from "../../hooks/useTheme"

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const title = getPageTitle(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          onOpenMobile={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
