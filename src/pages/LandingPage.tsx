import { Fragment, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Globe,
  LayoutGrid,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { PLANS, APP_NAME } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

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
          <span className="inline-flex items-center gap-2 border border-stone-900/15 bg-white px-3 py-1.5 font-landing-mono text-[11px] uppercase tracking-wider text-stone-500">
            <span className="animate-blink h-1.5 w-1.5 rounded-full bg-signal-500" />
            Motor de geração automática
          </span>

          <h1 className="mt-6 font-landing-display text-4xl font-bold leading-[1.08] tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
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
              to="/login"
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
          <div className="hud-corner animate-float relative overflow-hidden border border-stone-900/15 bg-white p-5 text-stone-400 shadow-[8px_8px_0_0_rgba(20,20,23,0.06)]">
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
    return () => {
      if (hadDark) root.classList.add("dark")
    }
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 text-stone-600">
      <Navbar />

      <Hero />

      {/* FEATURES */}
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Tudo que a coordenação precisa</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Construído para escolas que querem parar de montar horário em planilha.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <f.icon className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Como funciona</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Três passos entre a planilha bagunçada e a grade publicada.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
                <span className="font-display text-4xl font-bold text-brand-100 dark:text-brand-900">{`0${i + 1}`}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Planos para cada tamanho de escola</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Comece pequeno e cresça sem trocar de ferramenta.</p>

          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setCiclo("mensal")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                ciclo === "mensal" ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCiclo("anual")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                ciclo === "anual" ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Anual <span className="opacity-80">(2 meses grátis)</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-brand-500 bg-white shadow-2xl shadow-brand-500/20 ring-2 ring-brand-500 dark:bg-slate-900"
                  : "border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Mais popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-slate-900 dark:text-white">
                  {formatBRL(ciclo === "mensal" ? plan.priceMonthly : plan.priceYearly / 12)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/mês</span>
              </div>
              {ciclo === "anual" && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  {formatBRL(plan.priceYearly)} cobrados uma vez por ano
                </p>
              )}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-8 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200"
                }`}
              >
                Escolher {plan.name}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Pagamento recorrente será processado via Mercado Pago (integração em breve). Cancele quando quiser.
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-14 text-center shadow-2xl">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-bold text-white">Pronto para acabar com a planilha de horários?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-slate-300">
            Crie sua conta e gere a primeira grade horária da sua escola ainda hoje.
          </p>
          <Link
            to="/login"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-xl transition-transform hover:scale-[1.03]"
          >
            Começar gratuitamente <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
