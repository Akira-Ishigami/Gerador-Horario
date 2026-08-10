import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  CalendarClock,
  Check,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  Lightbulb,
  Link2,
  LogOut,
  Minus,
  Monitor,
  Plus,
  Save,
  Settings,
  Shield,
  Sparkles,
  Timer,
  Users as UsersIcon,
  X,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"
import { supabase } from "@/lib/supabaseClient"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PlanBadge } from "@/components/PlanBadge"
import { ScheduleGrid } from "@/components/ScheduleGrid"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { TurmasManager } from "@/components/dashboard/TurmasManager"
import { MateriasManager } from "@/components/dashboard/MateriasManager"
import { ProfessoresManager } from "@/components/dashboard/ProfessoresManager"
import { BlocosManager } from "@/components/dashboard/BlocosManager"
import { MOCK_USERS } from "@/data/mockData"
import { gerarHorarios, type GeneratedSchedule } from "@/lib/scheduleGenerator"
import { APP_NAME, MVP_SEM_LIMITES } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

const NAV_ITEMS = [
  { id: "carga-horaria", label: "Carga Horária", icon: Clock },
  { id: "turmas", label: "Turmas", icon: UsersIcon },
  { id: "materias", label: "Matérias", icon: BookOpen },
  { id: "professores", label: "Professores", icon: GraduationCap },
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "grade-escolar", label: "Grade Escolar", icon: Sparkles },
  { id: "exportar", label: "Exportar", icon: FileSpreadsheet },
] as const

type TabId = (typeof NAV_ITEMS)[number]["id"] | "admin"

const DICAS_GERADOR = [
  "Cadastre pelo menos um professor pra cada matéria com carga horária — sem professor, a matéria vira conflito.",
  "Se restringir um professor a turmas específicas (aba Professores), confira se as outras turmas também têm professor disponível pra mesma matéria.",
  "O gerador sorteia a distribuição — clicou e não gostou do resultado? Clique em \"Gerar horários\" de novo.",
  "Depois de gerar, arraste qualquer aula pra outro horário livre pra ajustar manualmente.",
  "Com o filtro \"Todos\" selecionado, arrastar uma aula move ela em todas as turmas do mesmo turno de uma vez.",
  "Configure o intervalo em \"Configurações\" antes de gerar — o gerador nunca encaixa aula nesse horário.",
  "Clique em \"Salvar horário\" depois de gerar/ajustar — sem isso a grade some ao trocar de tela ou dispositivo.",
]

const FREE_GEN_COOLDOWN_MS = 36 * 60 * 60 * 1000
const FREE_GEN_MAX_USES = 2

interface FreeGenState {
  windowEnd: number
  usesLeft: number
}

function freeGenKey(userId: string) {
  return `horaria_free_gen_${userId}`
}

/**
 * Plano Teste: até FREE_GEN_MAX_USES gerações dentro de uma janela de 36h.
 * Ao expirar a janela (ou na primeira vez), reseta a contagem.
 */
function loadFreeGenState(userId: string): FreeGenState {
  const raw = localStorage.getItem(freeGenKey(userId))
  const parsed: FreeGenState | null = raw ? JSON.parse(raw) : null
  if (!parsed || parsed.windowEnd < Date.now()) {
    const fresh: FreeGenState = { windowEnd: Date.now() + FREE_GEN_COOLDOWN_MS, usesLeft: FREE_GEN_MAX_USES }
    localStorage.setItem(freeGenKey(userId), JSON.stringify(fresh))
    return fresh
  }
  return parsed
}

function useFreeGenCooldown(userId: string) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!userId) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [userId])

  if (!userId) {
    return { remainingMs: 0, usesLeft: FREE_GEN_MAX_USES, registrarGeracao: () => true }
  }

  const state = loadFreeGenState(userId)
  const remainingMs = Math.max(0, state.windowEnd - Date.now())

  const registrarGeracao = () => {
    const current = loadFreeGenState(userId)
    if (current.usesLeft <= 0) return false
    const next: FreeGenState = { ...current, usesLeft: current.usesLeft - 1 }
    localStorage.setItem(freeGenKey(userId), JSON.stringify(next))
    setTick((t) => t + 1)
    return true
  }

  return { remainingMs, usesLeft: state.usesLeft, registrarGeracao }
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function DashboardPage() {
  useSEO({
    title: "Gerador de horários",
    description: "Monte e gerencie a grade horária das suas turmas.",
    path: "/app",
    noIndex: true,
  })

  const { user, logout } = useAuth()
  const { loading: dataLoading, turmas, updateCargaHoraria, updateCargaHorariaGeminada, professores, disciplinas, blocos } =
    useData()
  const { remainingMs: freeGenRemaining, usesLeft: freeGenUsesLeft, registrarGeracao } = useFreeGenCooldown(
    !MVP_SEM_LIMITES && user?.plan === "teste" ? user.id : "",
  )

  const [onboarded, setOnboarded] = useState(() => {
    if (!user) return true
    return localStorage.getItem(`horaria_onboarded_${user.id}`) === "true"
  })

  const [selectedId, setSelectedId] = useState<string>("todos")
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [tab, setTab] = useState<TabId>("carga-horaria")
  const [filtroTurmaId, setFiltroTurmaId] = useState<string>("todos")
  const [exportando, setExportando] = useState<"todos" | "professores" | "alunos" | null>(null)
  const [mostrarDicas, setMostrarDicas] = useState(() => localStorage.getItem("horaria_dicas_dispensadas") !== "true")

  useEffect(() => {
    if (selectedId !== "todos" && !turmas.some((t) => t.id === selectedId)) {
      setSelectedId("todos")
    }
  }, [turmas, selectedId])

  useEffect(() => {
    if (filtroTurmaId !== "todos" && !turmas.some((t) => t.id === filtroTurmaId)) {
      setFiltroTurmaId("todos")
    }
  }, [turmas, filtroTurmaId])

  useEffect(() => {
    if (!user) {
      setSchedule(null)
      return
    }
    let cancelado = false
    supabase
      .from("horarios_gerados")
      .select("grades, conflitos")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado || !data) return
        setSchedule({ grades: data.grades, conflitos: data.conflitos })
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const turmasCargaHoraria = selectedId === "todos" ? turmas : turmas.filter((t) => t.id === selectedId)
  const turmasFiltradas = filtroTurmaId === "todos" ? turmas : turmas.filter((t) => t.id === filtroTurmaId)

  const handleGerar = () => {
    if (!MVP_SEM_LIMITES && user?.plan === "teste" && !registrarGeracao()) return
    const result = gerarHorarios(turmas, professores, blocos, disciplinas)
    setSchedule(result)
    setSalvo(false)
  }

  const handleSalvar = () => {
    if (!user || !schedule) return
    supabase
      .from("horarios_gerados")
      .upsert({
        user_id: user.id,
        grades: schedule.grades,
        conflitos: schedule.conflitos,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar grade gerada:", error)
      })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  const handleMoveAssignment = (turmaId: string, fromDia: number, fromBloco: number, toDia: number, toBloco: number) => {
    setSalvo(false)
    // No filtro "Todos", o arrasto reflete em toda turma do mesmo turno da
    // turma arrastada (mesmo turno = mesma lista de blocos, então o índice
    // dia/bloco aponta pro mesmo horário real em todas). Turmas de outro
    // turno não são afetadas, e turma sem aula nenhuma no horário de origem
    // é pulada (nada pra mover nela).
    const turmaOrigem = turmas.find((t) => t.id === turmaId)
    const turmaIds =
      filtroTurmaId === "todos" && turmaOrigem
        ? turmas.filter((t) => t.turno === turmaOrigem.turno).map((t) => t.id)
        : [turmaId]

    setSchedule((prev) => {
      if (!prev) return prev
      const novosGrades = { ...prev.grades }
      for (const id of turmaIds) {
        const grade = prev.grades[id]
        const origem = grade?.[fromDia]?.[fromBloco] ?? null
        if (!grade || !origem) continue
        const novaGrade = grade.map((linha) => [...linha])
        const destino = novaGrade[toDia][toBloco]
        novaGrade[toDia][toBloco] = origem
        novaGrade[fromDia][fromBloco] = destino
        novosGrades[id] = novaGrade
      }
      return { ...prev, grades: novosGrades }
    })
  }

  if (!user) return null

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (!onboarded && turmas.length === 0) {
    return (
      <OnboardingWizard
        onFinish={() => {
          localStorage.setItem(`horaria_onboarded_${user.id}`, "true")
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-grid pointer-events-none fixed inset-0 -z-10 text-slate-900/3 dark:text-white/3" />
      <div className="pointer-events-none fixed -top-32 right-0 -z-10 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/20" />
      <div className="pointer-events-none fixed bottom-0 -left-32 -z-10 hidden h-96 w-96 rounded-full bg-accent-500/0 blur-3xl dark:block dark:bg-accent-500/10" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/90 print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30 transition-transform duration-300 group-hover:rotate-6">
              <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
            </span>
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm shadow-sm dark:border-white/10 sm:flex">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.charAt(0)}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{user.name}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  user.role === "admin"
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {user.role === "admin" ? <Shield className="h-3 w-3" /> : <UsersIcon className="h-3 w-3" />}
                {user.role === "admin" ? "Admin" : "Usuário"}
              </span>
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 print:hidden dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 lg:hidden">
          <Monitor className="h-4 w-4 shrink-0" />
          Pra melhor visualização, acesse pelo computador — o celular ainda tá em ajustes.
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar: navegação */}
          <aside className="space-y-4 self-start print:hidden lg:sticky lg:top-20">
            <PlanBadge planId={user.plan} turmasUsadas={turmas.length} />

            {!MVP_SEM_LIMITES && user.plan === "teste" && (
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-sm dark:border-brand-900 dark:bg-brand-950/40">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5" /> Gerações grátis
                  </span>
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-white">{freeGenUsesLeft}/{FREE_GEN_MAX_USES}</span>
                </div>
                {freeGenUsesLeft <= 0 ? (
                  <>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-900 dark:text-brand-200">
                      {formatCountdown(freeGenRemaining)}
                    </p>
                    <p className="mt-2 text-xs text-brand-700/80 dark:text-brand-300/80">
                      Limite atingido — libera {FREE_GEN_MAX_USES} novas gerações quando o tempo acabar.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-brand-700/80 dark:text-brand-300/80">
                    No plano Teste grátis você tem {FREE_GEN_MAX_USES} gerações a cada 36h.
                  </p>
                )}
                <Link
                  to="/#planos"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" /> Fazer upgrade de plano
                </Link>
              </div>
            )}

            <nav className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setTab("admin")}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === "admin"
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Administração
                </button>
              )}
            </nav>
          </aside>

          {/* Conteúdo */}
          <section className="min-w-0 space-y-6">
            {tab === "carga-horaria" && (
              <>
                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setSelectedId("todos")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedId === "todos"
                        ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    }`}
                  >
                    Todos
                  </button>
                  {turmas.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedId === t.id
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                      }`}
                    >
                      {t.nome}
                    </button>
                  ))}
                  {turmas.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("turmas")}
                      className="text-sm text-slate-400 underline underline-offset-2 hover:text-brand-600"
                    >
                      Nenhuma turma — crie uma em "Turmas"
                    </button>
                  )}
                </div>

                {turmasCargaHoraria.length > 0 ? (
                  selectedId === "todos" ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">
                          Carga horária semanal · Todas as turmas
                        </h2>
                        <button
                          type="button"
                          onClick={() =>
                            disciplinas.forEach((d) => {
                              const valor = turmas[0]?.cargaHoraria[d.id] ?? 0
                              turmas.forEach((t) => updateCargaHoraria(t.id, d.id, valor))
                            })
                          }
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                          Aplicar a todas as turmas
                        </button>
                      </div>
                      <p className="mb-3 text-xs text-slate-400">
                        Os valores abaixo são os da turma "{turmas[0]?.nome}". Ajustar no +/- já aplica em todas, mas
                        se uma matéria não mudou de número aqui e alguma turma ainda estava zerada, clique em
                        "Aplicar a todas as turmas" pra forçar a sincronização de tudo de uma vez.
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {disciplinas.map((d) => {
                          const valores = turmas.map((t) => t.cargaHoraria[d.id] ?? 0)
                          const valor = valores[0] ?? 0
                          const dessincronizado = valores.some((v) => v !== valor)
                          const geminada = turmas[0]?.cargaHorariaGeminada[d.id] ?? false
                          return (
                            <div
                              key={d.id}
                              className="rounded-xl border border-slate-100 p-3 transition-all hover:shadow-md dark:border-white/10 dark:hover:bg-white/5"
                              style={{ borderLeft: `3px solid ${d.cor}` }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.nome}</p>
                                {dessincronizado && (
                                  <span className="text-[10px] font-medium text-amber-500" title="Nem toda turma tem esse número">
                                    dessincronizado
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => turmas.forEach((t) => updateCargaHoraria(t.id, d.id, valor - 1))}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-display text-sm font-semibold text-slate-800 dark:text-white">{valor}</span>
                                <button
                                  type="button"
                                  onClick={() => turmas.forEach((t) => updateCargaHoraria(t.id, d.id, valor + 1))}
                                  className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => turmas.forEach((t) => updateCargaHorariaGeminada(t.id, d.id, !geminada))}
                                title="Tenta encaixar 2 aulas seguidas no mesmo dia em vez de espalhadas"
                                className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                  geminada
                                    ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                                    : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                <Link2 className="h-2.5 w-2.5" /> Geminada
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {turmasCargaHoraria.map((turma) => (
                        <div
                          key={turma.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">
                              Carga horária semanal · {turma.nome}
                            </h2>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {disciplinas.map((d) => {
                              const valor = turma.cargaHoraria[d.id] ?? 0
                              const geminada = turma.cargaHorariaGeminada[d.id] ?? false
                              return (
                                <div
                                  key={d.id}
                                  className="rounded-xl border border-slate-100 p-3 transition-all hover:shadow-md dark:border-white/10 dark:hover:bg-white/5"
                                  style={{ borderLeft: `3px solid ${d.cor}` }}
                                >
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.nome}</p>
                                  <div className="mt-1.5 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => updateCargaHoraria(turma.id, d.id, valor - 1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="font-display text-sm font-semibold text-slate-800 dark:text-white">{valor}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateCargaHoraria(turma.id, d.id, valor + 1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateCargaHorariaGeminada(turma.id, d.id, !geminada)}
                                    title="Tenta encaixar 2 aulas seguidas no mesmo dia em vez de espalhadas"
                                    className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                      geminada
                                        ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
                                        : "border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700"
                                    }`}
                                  >
                                    <Link2 className="h-2.5 w-2.5" /> Geminada
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-sm text-slate-400 dark:border-slate-700 dark:bg-white/2">
                    <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                    Crie uma turma para começar.
                  </div>
                )}
              </>
            )}

            {tab === "grade-escolar" && (
              <>
                {mostrarDicas && (
                  <div className="relative rounded-2xl border border-brand-200 bg-brand-50 p-4 pr-10 shadow-sm dark:border-brand-900 dark:bg-brand-950/40 print:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarDicas(false)
                        localStorage.setItem("horaria_dicas_dispensadas", "true")
                      }}
                      aria-label="Dispensar dicas"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-brand-500 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-900/40"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
                      <Lightbulb className="h-4 w-4" /> Dicas pra gerar uma grade melhor
                    </div>
                    <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-brand-700/90 dark:text-brand-300/90">
                      {DICAS_GERADOR.map((dica) => (
                        <li key={dica}>{dica}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 print:hidden">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFiltroTurmaId("todos")}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        filtroTurmaId === "todos"
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                      }`}
                    >
                      Todos
                    </button>
                    {turmas.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFiltroTurmaId(t.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          filtroTurmaId === t.id
                            ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        }`}
                      >
                        {t.nome}
                      </button>
                    ))}
                    {turmas.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setTab("turmas")}
                        className="text-sm text-slate-400 underline underline-offset-2 hover:text-brand-600"
                      >
                        Nenhuma turma — crie uma em "Turmas"
                      </button>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {schedule && (
                      <button
                        type="button"
                        onClick={handleSalvar}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                          salvo
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
                        }`}
                      >
                        {salvo ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {salvo ? "Salvo!" : "Salvar horário"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGerar}
                      disabled={turmas.length === 0 || (user.plan === "teste" && freeGenUsesLeft <= 0)}
                      className="group flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-600 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-brand-600/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                    >
                      <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />{" "}
                      Gerar horários
                    </button>
                  </div>
                </div>

                {schedule && schedule.conflitos.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 print:hidden">
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" /> {schedule.conflitos.length} conflito(s) encontrado(s)
                    </div>
                    <ul className="ml-6 list-disc space-y-0.5">
                      {schedule.conflitos.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {turmas.length > 0 ? (
                  <>
                    {!schedule && (
                      <p className="text-sm text-slate-400 print:hidden">
                        Clique em "Gerar horários" para preencher a grade de todas as turmas automaticamente.
                      </p>
                    )}

                    <div className="space-y-6">
                      {turmasFiltradas.map((turma) => (
                        <div key={turma.id}>
                          <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">
                              Grade horária · {turma.nome}
                            </h2>
                          </div>
                          <ScheduleGrid
                            grade={schedule?.grades[turma.id] ?? null}
                            blocos={blocos.filter((b) => b.turno === turma.turno)}
                            onMove={(fromDia, fromBloco, toDia, toBloco) =>
                              handleMoveAssignment(turma.id, fromDia, fromBloco, toDia, toBloco)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/50 text-sm text-slate-400 dark:border-slate-700 dark:bg-white/2">
                    <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                    Crie uma turma para começar.
                  </div>
                )}
              </>
            )}

            {tab === "turmas" && <TurmasManager />}
            {tab === "materias" && <MateriasManager />}
            {tab === "professores" && <ProfessoresManager />}
            {tab === "configuracoes" && <BlocosManager />}

            {tab === "exportar" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Exportar</h2>
                <p className="mb-4 text-xs text-slate-400">
                  Baixa um Excel com uma planilha por turma (grade completa) e uma por professor (só as aulas dele,
                  juntando todas as turmas que ele dá aula) — fácil de ajustar e imprimir do jeito que quiser.
                </p>
                {schedule ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setExportando("todos")
                        try {
                          const { exportarExcelCompleto } = await import("@/lib/exportExcel")
                          await exportarExcelCompleto(turmas, professores, disciplinas, blocos, schedule)
                        } finally {
                          setExportando(null)
                        }
                      }}
                      disabled={exportando !== null}
                      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-600 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {exportando === "todos" ? "Gerando..." : "Exportar todos"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setExportando("professores")
                        try {
                          const { exportarExcelProfessores } = await import("@/lib/exportExcel")
                          await exportarExcelProfessores(turmas, professores, disciplinas, blocos, schedule)
                        } finally {
                          setExportando(null)
                        }
                      }}
                      disabled={exportando !== null}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                    >
                      <GraduationCap className="h-4 w-4" />
                      {exportando === "professores" ? "Gerando..." : "Exportar professores"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setExportando("alunos")
                        try {
                          const { exportarExcelTurmas } = await import("@/lib/exportExcel")
                          await exportarExcelTurmas(turmas, professores, disciplinas, blocos, schedule)
                        } finally {
                          setExportando(null)
                        }
                      }}
                      disabled={exportando !== null}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                    >
                      <UsersIcon className="h-4 w-4" />
                      {exportando === "alunos" ? "Gerando..." : "Exportar alunos"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Gere os horários na aba "Grade Escolar" primeiro pra poder exportar.
                  </p>
                )}
              </div>
            )}

            {tab === "admin" && user.role === "admin" && <AdminPanel />}
          </section>
        </div>
      </main>
    </div>
  )
}

function AdminPanel() {
  const { professores } = useData()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Professores</h2>
        <p className="mb-4 text-xs text-slate-400">Editáveis na aba "Professores" — usados pelo gerador para alocar as aulas.</p>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {professores.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
              <span className="font-medium text-slate-700 dark:text-slate-200">{p.nome}</span>
              <span className="text-xs text-slate-400">{p.disciplinaIds.join(", ")}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Usuários</h2>
        <p className="mb-4 text-xs text-slate-400">Contas com acesso ao sistema (via banco de dados real).</p>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {MOCK_USERS.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">{u.name}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  u.role === "admin"
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {u.role}
              </span>
            </li>
          ))}
          {MOCK_USERS.length === 0 && (
            <li className="px-2 py-4 text-sm text-slate-400">Nenhuma conta cadastrada ainda.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
