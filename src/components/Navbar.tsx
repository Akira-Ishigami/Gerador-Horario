import { Link } from "react-router-dom"
import { CalendarClock, User } from "lucide-react"
import { APP_NAME } from "@/config/branding"

// Seção de planos/preços tirada do ar temporariamente (MVP com escolas piloto,
// sem cobrança) — ver MVP_SEM_LIMITES em config/branding.ts.
const LINKS = [
  { href: "#problema", label: "O problema" },
  { href: "#recursos", label: "Recursos" },
  { href: "#sistema", label: "Por dentro" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "Dúvidas" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 font-landing-sans">
      <div className="border-b border-stone-900/10 bg-stone-50/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5 font-landing-display text-lg font-bold text-stone-900">
            <span className="flex h-9 w-9 rotate-3 items-center justify-center rounded-lg bg-stone-900 text-white shadow-[3px_3px_0_0_var(--color-brand-500)] transition-transform duration-300 group-hover:rotate-0">
              <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
            </span>
            {APP_NAME}
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className="group flex items-center gap-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
              >
                <span className="font-landing-mono text-[10px] text-stone-400 transition-colors group-hover:text-brand-600">
                  0{i + 1}
                </span>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-950">
              Entrar
            </Link>
            <Link
              to="/login?modo=cadastro"
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--color-brand-500)] transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-brand-500)]"
            >
              Começar agora
            </Link>
          </div>

          <Link
            to="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/15 bg-white text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-600 lg:hidden"
            aria-label="Entrar ou criar conta"
          >
            <User className="h-5 w-5" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  )
}
