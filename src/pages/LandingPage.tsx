import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Globe,
  Hourglass,
  LayoutGrid,
  Medal,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { PAID_PLANS, APP_NAME } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

const PROBLEMS = [
  {
    icon: Hourglass,
    stat: "Dias perdidos",
    desc: "remontando a planilha inteira toda vez que um professor muda de turma ou disciplina.",
  },
  {
    icon: AlertTriangle,
    stat: "Conflito tardio",
    desc: "o choque de horário só aparece depois de publicado — e aí já é tarde para corrigir sem dor de cabeça.",
  },
  {
    icon: User,
    stat: "1 pessoa só",
    desc: "geralmente só a coordenação sabe montar a grade do zero, e tudo trava se ela faltar.",
  },
]

const PLAN_ICON = { bronze: Medal, prata: Award, ouro: Crown } as const

const HERO_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"]
const HERO_HOURS = ["07:00", "07:50", "08:40", "09:50", "10:40"]
const HERO_SOLVED_COLORS = ["bg-brand-500", "bg-accent-500", "bg-emerald-500", "bg-brand-300"]
const HERO_CONFLICT_CELLS = new Set([3, 14])

function heroJitter(i: number) {
  return {
    x: ((i * 37) % 9) - 4,
    y: ((i * 53) % 9) - 4,
    r: ((i * 71) % 13) - 6,
  }
}

function Hero() {
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSolved(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative overflow-hidden bg-stone-50 font-landing-sans">
      <div className="noise-overlay pointer-events-none absolute inset-0 -z-10" />
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 text-stone-900/6" />
      <div className="animate-orbit pointer-events-none absolute -right-32 -top-32 -z-10 h-105 w-105 rounded-full border border-dashed border-brand-300/50" />
      <div className="pointer-events-none absolute right-20 top-16 -z-10 h-2 w-2 rounded-full bg-accent-500" />

      <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-landing-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
            Grade horária pronta em{" "}
            <span className="relative inline-block text-brand-600">
              minutos
              <svg viewBox="0 0 120 12" className="absolute -bottom-1 left-0 h-3 w-full overflow-visible" aria-hidden="true">
                <motion.path
                  d="M2 8 C 20 2, 40 10, 60 6 C 80 2, 100 10, 118 5"
                  fill="none"
                  stroke="var(--color-brand-500)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.9, ease: "easeInOut" }}
                />
              </svg>
            </span>
            <span className="mt-2 block text-2xl font-medium text-stone-400 sm:text-3xl">
              Não em{" "}
              <span className="text-stone-400 line-through decoration-signal-500 decoration-4">semanas</span> de
              planilha.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-stone-600">
            {APP_NAME} organiza turmas, professores e disciplinas automaticamente e elimina os choques de horário
            antes de publicar. Sua coordenação para de apagar incêndio — e volta a coordenar.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login?modo=cadastro"
              className="group inline-flex items-center gap-2 bg-stone-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[4px_4px_0_0_var(--color-brand-500)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-brand-500)]"
            >
              Começar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 border border-stone-900/15 px-6 py-3.5 text-sm font-semibold text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              Ver como funciona
            </a>
          </div>

          <div className="mt-8 flex items-center gap-2 font-landing-mono text-xs uppercase tracking-wide text-stone-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sem cartão de crédito para testar
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
              e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
            }}
            className="hud-corner animate-float group relative overflow-hidden border border-stone-900/15 bg-white p-5 text-stone-400 shadow-[8px_8px_0_0_rgba(20,20,23,0.06)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), var(--color-brand-100), transparent 60%)" }}
            />
            <div className="animate-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-accent-400/25 via-accent-400/10 to-transparent" />

            <div className="mb-4 flex items-center justify-between font-landing-mono text-[10px] uppercase tracking-wider">
              <span className="text-stone-400">Turma · 6º Ano A</span>
              <span className={`flex items-center gap-1.5 ${solved ? "text-emerald-600" : "text-signal-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${solved ? "bg-emerald-500" : "animate-pulse bg-signal-500"}`} />
                {solved ? "0 conflitos" : "calculando"}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 text-[10px]">
              <div />
              {HERO_DAYS.map((d) => (
                <div key={d} className="pb-1 text-center font-landing-mono font-semibold text-stone-400">
                  {d}
                </div>
              ))}
              {HERO_HOURS.map((h, row) => (
                <Fragment key={h}>
                  <div className="pr-1 text-right font-landing-mono text-stone-400">{h}</div>
                  {[0, 1, 2, 3, 4].map((col) => {
                    const i = row * 5 + col
                    const j = heroJitter(i)
                    const isConflict = HERO_CONFLICT_CELLS.has(i)
                    const color = isConflict && !solved ? "bg-signal-500" : HERO_SOLVED_COLORS[i % HERO_SOLVED_COLORS.length]
                    return (
                      <motion.div
                        key={col}
                        initial={{ opacity: 0, x: j.x, y: j.y, rotate: j.r, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.018, type: "spring", stiffness: 260, damping: 20 }}
                        className={`h-6 rounded-[3px] ${color} transition-colors duration-500`}
                      />
                    )
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: solved ? 1 : 0, y: solved ? 0 : 10 }}
            transition={{ duration: 0.4 }}
            className="absolute -bottom-5 -left-5 border border-emerald-200 bg-white px-4 py-2.5 font-landing-mono text-xs font-semibold text-emerald-600 shadow-[4px_4px_0_0_rgba(16,185,129,0.15)]"
          >
            ✓ 0 conflitos detectados
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: Zap,
    title: "Geração automática",
    desc: "Monte a grade horária completa da escola em segundos, sem esbarrar em conflitos de professores.",
  },
  {
    icon: ShieldCheck,
    title: "Zero conflitos",
    desc: "O sistema verifica automaticamente choques de horário entre turmas e professores antes de publicar.",
  },
  {
    icon: LayoutGrid,
    title: "Interface intuitiva",
    desc: "Cadastre turmas, disciplinas e carga horária em um painel simples, sem curva de aprendizado.",
  },
  {
    icon: Users,
    title: "Multiusuário",
    desc: "Coordenação e direção acompanham e ajustam a grade juntas, com papéis de acesso definidos.",
  },
  {
    icon: Globe,
    title: "Acesso de qualquer lugar",
    desc: "Acesse a grade da escola de qualquer dispositivo, sem instalar nada — é só abrir o navegador.",
  },
  {
    icon: CalendarCheck2,
    title: "Exportação rápida",
    desc: "Exporte a grade pronta em PDF para compartilhar com professores e responsáveis.",
  },
]

const STEPS = [
  {
    title: "Cadastre suas turmas",
    desc: "Adicione turmas, disciplinas e professores — leva poucos minutos, direto na sua tela.",
  },
  {
    title: "Defina a carga horária",
    desc: "Informe quantas aulas por semana cada disciplina precisa. O resto é com a gente.",
  },
  {
    title: "Gere a grade com um clique",
    desc: "Nosso motor organiza tudo automaticamente e sinaliza qualquer conflito para revisão.",
  },
]

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function LandingPage() {
  useSEO({
    title: `${APP_NAME} — Gerador de horário escolar automático`,
    description:
      "Crie a grade horária da sua escola em minutos. Geração automática, sem conflitos de professores, com planos a partir de R$ 49,90/mês.",
    path: "/",
  })

  const [ciclo, setCiclo] = useState<"mensal" | "anual">("mensal")

  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains("dark")
    root.classList.remove("dark")
    // ThemeProvider (ancestor) re-applies "dark" in its own mount effect, which fires
    // after this one — observer keeps this route forced light regardless of that order.
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) root.classList.remove("dark")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      if (hadDark) root.classList.add("dark")
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 font-landing-sans text-stone-600">
      <Navbar />

      <Hero />

      {/* PROBLEM */}
      <section id="problema" className="border-y border-stone-900/10 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-bold text-stone-950 sm:text-4xl">
              Montar horário no olho custa mais caro do que parece.
            </h2>
            <p className="mt-3 text-stone-500">
              A planilha não avisa quando dois horários colidem — só a coordenação percebe, depois de publicado.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.stat}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group border border-stone-900/12 bg-stone-50 p-6 shadow-[6px_6px_0_0_rgba(20,20,23,0.06)] transition-shadow duration-300 hover:shadow-[8px_8px_0_0_var(--color-signal-500)]"
              >
                <motion.div
                  whileHover={{ rotate: -8, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="inline-block"
                >
                  <p.icon className="h-5 w-5 text-signal-500" strokeWidth={2.25} />
                </motion.div>
                <p className="mt-4 font-landing-display text-3xl font-bold text-stone-950">{p.stat}</p>
                <p className="mt-2 text-sm text-stone-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-landing-display text-3xl font-bold text-stone-950 sm:text-4xl">Tudo que a coordenação precisa</h2>
          <p className="mt-3 text-stone-500">Construído para escolas que querem parar de montar horário em planilha.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative border border-stone-900/12 bg-white p-6 shadow-[6px_6px_0_0_rgba(20,20,23,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_var(--color-brand-500)]"
            >
              <span className="absolute right-4 top-4 font-landing-mono text-[10px] text-stone-300">0{i + 1}</span>
              <div className="flex h-11 w-11 items-center justify-center border border-stone-900/10 bg-stone-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                <f.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" strokeWidth={2.25} />
              </div>
              <h3 className="mt-4 font-landing-display text-lg font-semibold text-stone-950">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="border-y border-stone-900/10 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-landing-display text-3xl font-bold text-stone-950 sm:text-4xl">Três passos, não três semanas</h2>
            <p className="mt-3 text-stone-500">Da planilha bagunçada até a grade publicada.</p>
          </div>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: "left" }}
              className="absolute left-0 right-0 top-9 hidden h-px bg-brand-200 md:block"
            />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="relative border border-stone-900/12 bg-stone-50 p-6 shadow-[6px_6px_0_0_rgba(20,20,23,0.06)] transition-shadow duration-300 hover:shadow-[8px_8px_0_0_var(--color-accent-500)]"
              >
                <span className="flex h-7 w-7 items-center justify-center border border-brand-200 bg-white font-landing-mono text-sm font-semibold text-brand-500">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-landing-display text-lg font-semibold text-stone-950">{s.title}</h3>
                <p className="mt-2 text-sm text-stone-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-landing-display text-3xl font-bold text-stone-950 sm:text-4xl">Planos para cada tamanho de escola</h2>
          <p className="mt-3 text-stone-500">Comece pequeno e cresça sem trocar de ferramenta.</p>

          <div className="relative mt-6 inline-flex items-center gap-1 border border-stone-900/15 bg-white p-1">
            <button
              type="button"
              onClick={() => setCiclo("mensal")}
              className={`relative px-4 py-1.5 text-sm font-medium transition-colors ${
                ciclo === "mensal" ? "text-white" : "text-stone-500"
              }`}
            >
              {ciclo === "mensal" && (
                <motion.span
                  layoutId="toggle-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-stone-950"
                />
              )}
              <span className="relative z-10">Mensal</span>
            </button>
            <button
              type="button"
              onClick={() => setCiclo("anual")}
              className={`relative px-4 py-1.5 text-sm font-medium transition-colors ${
                ciclo === "anual" ? "text-white" : "text-stone-500"
              }`}
            >
              {ciclo === "anual" && (
                <motion.span
                  layoutId="toggle-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-stone-950"
                />
              )}
              <span className="relative z-10">
                Anual <span className="opacity-70">(2 meses grátis)</span>
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PAID_PLANS.map((plan, i) => {
            const Icon = PLAN_ICON[plan.id as keyof typeof PLAN_ICON]
            return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.01 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative flex flex-col bg-white p-8 transition-shadow duration-300 ${
                plan.highlight
                  ? "border border-brand-500 shadow-[8px_8px_0_0_var(--color-brand-500)]"
                  : "border border-stone-900/12 shadow-[6px_6px_0_0_rgba(20,20,23,0.06)] hover:shadow-[8px_8px_0_0_rgba(20,20,23,0.12)]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 flex items-center gap-1.5 border border-brand-600 bg-brand-600 px-3 py-1 font-landing-mono text-[10px] uppercase tracking-wider text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Mais popular
                </span>
              )}
              <div className="flex h-10 w-10 items-center justify-center border border-stone-900/10 bg-stone-50 text-brand-600">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <h3 className="mt-4 font-landing-display text-xl font-bold text-stone-950">{plan.name}</h3>
              <p className="mt-1 text-sm text-stone-500">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={ciclo}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="font-landing-display text-4xl font-bold text-stone-950"
                  >
                    {formatBRL(ciclo === "mensal" ? plan.priceMonthly : plan.priceYearly / 12)}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm text-stone-500">/mês</span>
              </div>
              {ciclo === "anual" && (
                <p className="mt-1 font-landing-mono text-xs text-emerald-600">
                  {formatBRL(plan.priceYearly)} cobrados uma vez por ano
                </p>
              )}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                to="/login?modo=cadastro"
                className={`mt-8 inline-flex items-center justify-center px-4 py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-stone-950 text-white hover:bg-stone-800"
                    : "border border-stone-900/15 text-stone-700 hover:border-brand-400 hover:text-brand-600"
                }`}
              >
                Escolher {plan.name}
              </Link>
            </motion.div>
            )
          })}
        </div>

        <p className="mt-6 text-center font-landing-mono text-xs text-stone-400">
          Pagamento recorrente será processado via Mercado Pago (integração em breve). Cancele quando quiser.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden border border-stone-900/15 bg-white px-8 py-14 text-center shadow-[10px_10px_0_0_var(--color-brand-500)]"
        >
          <div className="bg-grid pointer-events-none absolute inset-0 -z-10 text-stone-900/6" />
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative font-landing-display text-3xl font-bold text-stone-950 sm:text-4xl"
          >
            Pronto para acabar com a planilha de horários?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="relative mx-auto mt-3 max-w-xl text-stone-500"
          >
            Crie sua conta e gere a primeira grade horária da sua escola ainda hoje.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.26 }}
          >
            <Link
              to="/login?modo=cadastro"
              className="group relative mt-8 inline-flex items-center gap-2 bg-stone-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[4px_4px_0_0_var(--color-brand-500)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-brand-500)]"
            >
              Começar gratuitamente <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
