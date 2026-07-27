import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, CalendarClock, Menu, X, Zap } from "lucide-react"
import { APP_NAME } from "@/config/branding"

const LINKS = [
  { href: "#problema", label: "O problema" },
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 font-landing-sans">
      <Link
        to="/login?modo=cadastro"
        className="group relative flex items-center justify-center gap-2 overflow-hidden bg-stone-950 px-4 py-2.5 text-center font-landing-mono text-xs font-bold uppercase tracking-wide text-white sm:text-sm"
      >
        <span className="animate-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/10" />
        <motion.span
          animate={{ scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap className="h-4 w-4 shrink-0 fill-signal-400 text-signal-400" />
        </motion.span>
        <span className="flex items-baseline gap-1.5">
          <span className="hidden sm:inline">Teste grátis, sem cartão —</span>
          <motion.span
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="font-landing-display text-sm font-black tracking-normal text-signal-400 sm:text-lg"
          >
            VENHA
          </motion.span>
          <span className="hidden sm:inline">gerar seus horários automaticamente</span>
          <span className="sm:hidden">gerar seus horários!</span>
        </span>
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </motion.span>
      </Link>

      <div className="border-b border-stone-900/10 bg-stone-50/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5 font-landing-display text-lg font-bold text-stone-900">
            <span className="flex h-9 w-9 rotate-3 items-center justify-center rounded-lg bg-stone-900 text-white shadow-[3px_3px_0_0_var(--color-brand-500)] transition-transform duration-300 group-hover:rotate-0">
              <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
            </span>
            {APP_NAME}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
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

          <div className="hidden items-center gap-3 md:flex">
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

          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 text-stone-700 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-stone-900/10 bg-stone-50 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-stone-700"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-stone-900/10 pt-3">
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700">
                  Entrar
                </Link>
                <Link to="/login?modo=cadastro" className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white">
                  Começar
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
