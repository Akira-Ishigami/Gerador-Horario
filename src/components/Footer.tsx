import { useRef } from "react"
import { APP_NAME, APP_TAGLINE } from "@/config/branding"

const LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#sistema", label: "Por dentro do sistema" },
  { href: "#faq", label: "Dúvidas" },
  { href: "/login?modo=cadastro", label: "Criar conta" },
]

export function Footer() {
  const glowRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    glowRef.current?.style.setProperty("--mx", `${e.clientX - rect.left}px`)
    glowRef.current?.style.setProperty("--my", `${e.clientY - rect.top}px`)
  }

  return (
    <footer
      onMouseMove={handleMouseMove}
      className="group relative overflow-hidden border-t border-white/10 bg-stone-950 font-landing-sans"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: "radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-brand-500) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="noise-overlay pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
          <div className="flex items-center gap-2.5 font-landing-display text-base font-bold text-white">
            <span className="flex h-7 w-7 rotate-3 items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src="/images/icon.png" alt="" className="h-full w-full object-cover" />
            </span>
            {APP_NAME}
            <span className="hidden font-landing-sans text-sm font-normal text-stone-500 lg:inline">— {APP_TAGLINE}</span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-stone-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col-reverse items-center gap-3 border-t border-white/10 pt-6 text-xs text-stone-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://www.instagram.com/dev__akira/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1px] bg-bottom-left bg-no-repeat font-medium text-stone-300 transition-[background-size,color] duration-300 ease-out hover:bg-size-[100%_1px] hover:text-white"
            >
              Akira Ishigami Magalhães
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
