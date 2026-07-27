import { CalendarClock } from "lucide-react"
import { APP_NAME, APP_TAGLINE } from "@/config/branding"

export function Footer() {
  return (
    <footer className="border-t border-stone-900/10 bg-white font-landing-sans">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 font-landing-display text-lg font-bold text-stone-950">
              <span className="flex h-8 w-8 rotate-3 items-center justify-center rounded-lg bg-stone-900 text-white">
                <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
              </span>
              {APP_NAME}
            </div>
            <p className="mt-2 max-w-sm text-sm text-stone-500">{APP_TAGLINE}</p>
          </div>
          <p className="font-landing-mono text-xs text-stone-400">
            © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados. Ambiente de demonstração — dados fictícios.
          </p>
        </div>
      </div>
    </footer>
  )
}
