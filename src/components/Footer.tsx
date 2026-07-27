import { CalendarClock } from "lucide-react"
import { APP_NAME, APP_TAGLINE } from "@/config/branding"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
              </span>
              {APP_NAME}
            </div>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{APP_TAGLINE}</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados. Ambiente de demonstração — dados fictícios.
          </p>
        </div>
      </div>
    </footer>
  )
}
