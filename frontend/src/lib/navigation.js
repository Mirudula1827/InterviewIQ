import {
  LayoutDashboard,
  PlusCircle,
  Radio,
  FileText,
  TrendingUp,
  Settings,
} from "lucide-react"

export const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "New Interview", to: "/new-interview", icon: PlusCircle },
  { label: "Live Interview", to: "/live-interview", icon: Radio },
  { label: "Reports", to: "/reports", icon: FileText },
  { label: "Progress", to: "/progress", icon: TrendingUp },
  { label: "Settings", to: "/settings", icon: Settings },
]

export function getPageTitle(pathname) {
  const match = navItems.find((item) => pathname.startsWith(item.to))
  return match ? match.label : "InterviewPrep AI"
}
