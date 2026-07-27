import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-pressed={isDark}
      className={`relative inline-flex h-9 w-16 items-center rounded-full border border-slate-300/70 bg-slate-200/70 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 dark:bg-slate-950 ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-brand-300" strokeWidth={2} />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" strokeWidth={2} />
        )}
      </span>
    </button>
  )
}
