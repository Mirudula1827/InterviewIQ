import { useEffect, useState } from "react"

const STORAGE_KEY = "interviewprep-theme"

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark"
    return localStorage.getItem(STORAGE_KEY) || "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("light", theme === "light")
    root.classList.toggle("dark", theme === "dark")
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))

  return { theme, toggleTheme }
}
