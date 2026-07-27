import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  CalendarClock,
  LogOut,
  Minus,
  Plus,
  Printer,
  Shield,
  Sparkles,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PlanBadge } from "@/components/PlanBadge"
import { ScheduleGrid } from "@/components/ScheduleGrid"
import { NovaTurmaModal } from "@/components/NovaTurmaModal"
import { DISCIPLINAS, MOCK_USERS, PROFESSORES } from "@/data/mockData"
import { gerarHorarios, type GeneratedSchedule } from "@/lib/scheduleGenerator"
import { APP_NAME } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

export default function DashboardPage() {
  useSEO({
    title: "Gerador de horários",
    description: "Monte e gerencie a grade horária das suas turmas.",
    path: "/app",
    noIndex: true,
  })

  const { user, logout } = useAuth()
  const { turmas, addTurma, removeTurma, updateCargaHoraria, limiteAtingido, maxTurmas } = useData()

  const [selectedId, setSelectedId] = useState<string | null>(turmas[0]?.id ?? null)
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState<"gerador" | "admin">("gerador")

  useEffect(() => {
    if (!selectedId && turmas.length > 0) setSelectedId(turmas[0].id)
    if (selectedId && !turmas.some((t) => t.id === selectedId)) {
      setSelectedId(turmas[0]?.id ?? null)
    }
  }, [turmas, selectedId])

  const selectedTurma = turmas.find((t) => t.id === selectedId) ?? null

  const handleGerar = () => {
    const result = gerarHorarios(turmas, PROFESSORES)
    setSchedule(result)
  }

  const handlePrint = () => window.print()

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90 print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/30">
              <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
            </span>
            {APP_NAME}
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm dark:border-white/10 sm:flex">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
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
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
            <div className="flex gap-1 border-t border-slate-100 pt-2 dark:border-white/5">
              {(
                [
                  { id: "gerador", label: "Gerador de horários" },
                  { id: "admin", label: "Administração" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {tab === "admin" && user.role === "admin" ? (
          <AdminPanel />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-4 print:hidden">
              <PlanBadge planId={user.plan} turmasUsadas={turmas.length} />

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">Turmas</h2>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    disabled={limiteAtingido}
                    className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nova
                  </button>
                </div>

                <ul className="space-y-1.5">
                  {turmas.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          selectedId === t.id
                            ? "bg-brand-600 text-white"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>
                          <span className="block font-medium">{t.nome}</span>
                          <span className={`block text-xs capitalize ${selectedId === t.id ? "text-brand-100" : "text-slate-400"}`}>
                            {t.turno}
                          </span>
                        </span>
                        <Trash2
                          className={`h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                            selectedId === t.id ? "text-white hover:text-rose-200" : "text-slate-400 hover:text-rose-500"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTurma(t.id)
                          }}
                        />
                      </button>
                    </li>
                  ))}
                  {turmas.length === 0 && (
                    <p className="px-1 py-2 text-sm text-slate-400">Nenhuma turma cadastrada ainda.</p>
                  )}
                </ul>
                {maxTurmas !== null && (
                  <p className="mt-3 text-xs text-slate-400">
                    {turmas.length} de {maxTurmas} turmas usadas neste plano.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleGerar}
                disabled={turmas.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" /> Gerar horários
              </button>
            </aside>

            {/* Main content */}
            <section className="space-y-6">
              {schedule && schedule.conflitos.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
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

              {selectedTurma ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 print:hidden">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">
                        Carga horária semanal · {selectedTurma.nome}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {DISCIPLINAS.map((d) => {
                        const valor = selectedTurma.cargaHoraria[d.id] ?? 0
                        return (
                          <div
                            key={d.id}
                            className="rounded-xl border border-slate-100 p-3 dark:border-white/5"
                            style={{ borderLeft: `3px solid ${d.cor}` }}
                          >
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.nome}</p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => updateCargaHoraria(selectedTurma.id, d.id, valor - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-display text-sm font-semibold text-slate-800 dark:text-white">{valor}</span>
                              <button
                                type="button"
                                onClick={() => updateCargaHoraria(selectedTurma.id, d.id, valor + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div id="print-area">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">
                        Grade horária · {selectedTurma.nome}
                      </h2>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 print:hidden"
                      >
                        <Printer className="h-3.5 w-3.5" /> Exportar / imprimir
                      </button>
                    </div>
                    <ScheduleGrid grade={schedule?.grades[selectedTurma.id] ?? null} />
                    {!schedule && (
                      <p className="mt-3 text-sm text-slate-400 print:hidden">
                        Clique em "Gerar horários" para preencher a grade automaticamente.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
                  Crie uma turma para começar.
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <NovaTurmaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(nome, turno) => addTurma({ nome, turno, cargaHoraria: {} })}
      />
    </div>
  )
}

function AdminPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Professores</h2>
        <p className="mb-4 text-xs text-slate-400">Cadastro mock — usado pelo gerador para alocar as aulas.</p>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {PROFESSORES.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{p.nome}</span>
              <span className="text-xs text-slate-400">{p.disciplinaIds.join(", ")}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Usuários</h2>
        <p className="mb-4 text-xs text-slate-400">Contas mock com acesso ao sistema.</p>
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {MOCK_USERS.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
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
        </ul>
      </div>
    </div>
  )
}
