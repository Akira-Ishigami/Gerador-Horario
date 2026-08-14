import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  Boxes,
  CalendarClock,
  Clock,
  Copy,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  Lightbulb,
  Link2,
  LogOut,
  Monitor,
  Save,
  Shield,
  Sparkles,
  Timer,
  Users as UsersIcon,
  X,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"
import { supabase } from "@/lib/supabaseClient"
import { PlanBadge } from "@/components/PlanBadge"
import { ScheduleGrid } from "@/components/ScheduleGrid"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { TurmasManager } from "@/components/dashboard/TurmasManager"
import { MateriasManager } from "@/components/dashboard/MateriasManager"
import { ProfessoresManager } from "@/components/dashboard/ProfessoresManager"
import { BlocosManager } from "@/components/dashboard/BlocosManager"
import { InstituicaoManager } from "@/components/dashboard/InstituicaoManager"
import { TiposEspecificosManager } from "@/components/dashboard/TiposEspecificosManager"
import { FixarAulasManager } from "@/components/dashboard/FixarAulasManager"
import { LimitarHorariosManager } from "@/components/dashboard/LimitarHorariosManager"
import { CoincidirAulasManager } from "@/components/dashboard/CoincidirAulasManager"
import { LimitarGrupoDisciplinasManager } from "@/components/dashboard/LimitarGrupoDisciplinasManager"
import { RecursosManager } from "@/components/dashboard/RecursosManager"
import { RelatoriosManager } from "@/components/dashboard/RelatoriosManager"
import { SavedSchedulesModal, formatarDataSlot, type SlotHorario } from "@/components/dashboard/SavedSchedulesModal"
import { MenuDropdown } from "@/components/dashboard/MenuDropdown"
import { MOCK_USERS } from "@/data/mockData"
import { gerarHorarios, type GeneratedSchedule } from "@/lib/scheduleGenerator"
import { APP_NAME, MVP_SEM_LIMITES } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

/**
 * Menu horizontal com dropdown (Cadastros/Controles/Horário) em vez da
 * sidebar antiga — inspirado na estrutura do Urânia, não no visual dele.
 * Configurações/Exportar ficam fora dos grupos por enquanto, como botões
 * diretos — o usuário decide depois onde encaixar.
 */
const MENU_CADASTROS = [
  { id: "turmas", label: "Turmas", icon: UsersIcon },
  { id: "materias", label: "Disciplinas", icon: BookOpen },
  { id: "professores", label: "Professores", icon: GraduationCap },
  { id: "carga-horaria", label: "Carga Horária", icon: Clock },
] as const
const MENU_CONTROLES = [
  {
    id: "controles-turmas",
    label: "Turmas",
    icon: UsersIcon,
    children: [{ id: "coincidir-aulas", label: "Coincidir aulas" }],
  },
  {
    id: "controles-professores",
    label: "Professores",
    icon: GraduationCap,
    children: [
      { id: "tipos-especificos", label: "Tipos específicos" },
      { id: "fixar-aulas", label: "Fixar aulas" },
    ],
  },
  {
    id: "controles-disciplinas",
    label: "Disciplinas",
    icon: BookOpen,
    children: [
      { id: "limitar-horarios", label: "Limitar horários" },
      { id: "limitar-grupo-disciplinas", label: "Limitar grupo de disciplinas" },
    ],
  },
  { id: "recursos", label: "Recursos", icon: Boxes },
] as const
const MENU_RELATORIOS = [
  {
    id: "relatorios-turmas",
    label: "Turmas",
    icon: UsersIcon,
    children: [
      { id: "relatorios-turmas-individual", label: "Individual" },
      { id: "relatorios-turmas-geral", label: "Geral" },
    ],
  },
  {
    id: "relatorios-professores",
    label: "Professores",
    icon: GraduationCap,
    children: [
      { id: "relatorios-professores-individual", label: "Individual" },
      { id: "relatorios-professores-geral", label: "Geral" },
    ],
  },
] as const

type TabId =
  | (typeof MENU_CADASTROS)[number]["id"]
  // MENU_CONTROLES mistura itens diretos (ex: "recursos") com grupos que só
  // navegam pelos filhos — listar os ids reais aqui em vez de derivar do
  // array evita ter que lidar com esses dois formatos no tipo.
  | "tipos-especificos"
  | "fixar-aulas"
  | "limitar-horarios"
  | "coincidir-aulas"
  | "limitar-grupo-disciplinas"
  | "recursos"
  | (typeof MENU_RELATORIOS)[number]["children"][number]["id"]
  | "inicio"
  | "configuracoes"
  | "grade-escolar"
  | "exportar"
  | "admin"

const DICAS_GERADOR = [
  "Cadastre pelo menos um professor pra cada disciplina com carga horária — sem professor, a disciplina vira conflito.",
  "Se restringir um professor a turmas específicas (aba Professores), confira se as outras turmas também têm professor disponível pra mesma disciplina.",
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

const TOTAL_SLOTS_HORARIO = 4

function slotsVazios(): SlotHorario[] {
  return Array.from({ length: TOTAL_SLOTS_HORARIO }, (_, i) => ({
    slotId: i + 1,
    nome: `Horário ${i + 1}`,
    grades: null,
    conflitos: [],
    updatedAt: null,
  }))
}

export default function DashboardPage() {
  useSEO({
    title: "Gerador de horários",
    description: "Monte e gerencie a grade horária das suas turmas.",
    path: "/app",
    noIndex: true,
  })

  const { user, logout } = useAuth()
  const {
    loading: dataLoading,
    turmas,
    updateCargaHoraria,
    updateCargaHorariaGeminada,
    professores,
    disciplinas,
    blocos,
    recursos,
    gruposCoincidencia,
    gruposDisciplinas,
  } = useData()
  const { remainingMs: freeGenRemaining, usesLeft: freeGenUsesLeft, registrarGeracao } = useFreeGenCooldown(
    !MVP_SEM_LIMITES && user?.plan === "teste" ? user.id : "",
  )

  const [onboarded, setOnboarded] = useState(() => {
    if (!user) return true
    return localStorage.getItem(`horaria_onboarded_${user.id}`) === "true"
  })

  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null)
  const [slots, setSlots] = useState<SlotHorario[]>(slotsVazios())
  const [modalSlotsAberto, setModalSlotsAberto] = useState(false)
  const [tab, setTab] = useState<TabId>("inicio")
  const [filtroTurmaId, setFiltroTurmaId] = useState<string>("todos")
  const [exportando, setExportando] = useState<"todos" | "professores" | "alunos" | "word-professores" | "word-turmas" | null>(null)
  const [mostrarDicas, setMostrarDicas] = useState(() => localStorage.getItem("horaria_dicas_dispensadas") !== "true")

  useEffect(() => {
    if (filtroTurmaId !== "todos" && !turmas.some((t) => t.id === filtroTurmaId)) {
      setFiltroTurmaId("todos")
    }
  }, [turmas, filtroTurmaId])

  useEffect(() => {
    if (!user) {
      setSchedule(null)
      setSlots(slotsVazios())
      return
    }
    let cancelado = false
    supabase
      .from("horarios_gerados")
      .select("slot_id, nome, grades, conflitos, updated_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelado) return
        const base = slotsVazios()
        for (const row of data ?? []) {
          const slot = base.find((s) => s.slotId === row.slot_id)
          if (!slot) continue // slot_id fora de 1-4 (não deveria acontecer, mas não trava a tela)
          slot.nome = row.nome ?? slot.nome
          slot.grades = row.grades
          slot.conflitos = row.conflitos ?? []
          slot.updatedAt = row.updated_at
        }
        setSlots(base)
        // abre já com o mais recente carregado, pra continuar de onde parou
        const maisRecente = [...base].filter((s) => s.grades).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0]
        if (maisRecente?.grades) setSchedule({ grades: maisRecente.grades, conflitos: maisRecente.conflitos })
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const turmasFiltradas = filtroTurmaId === "todos" ? turmas : turmas.filter((t) => t.id === filtroTurmaId)

  const handleGerar = () => {
    if (!MVP_SEM_LIMITES && user?.plan === "teste" && !registrarGeracao()) return
    const result = gerarHorarios(turmas, professores, blocos, disciplinas, recursos, gruposCoincidencia, gruposDisciplinas)
    setSchedule(result)
  }

  const handleSalvarSlot = (slotId: number) => {
    if (!user || !schedule) return
    const nomeAtual = slots.find((s) => s.slotId === slotId)?.nome ?? `Horário ${slotId}`
    const agora = new Date().toISOString()
    supabase
      .from("horarios_gerados")
      .upsert(
        { user_id: user.id, slot_id: slotId, nome: nomeAtual, grades: schedule.grades, conflitos: schedule.conflitos, updated_at: agora },
        { onConflict: "user_id,slot_id" },
      )
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar horário no slot:", error)
      })
    setSlots((prev) => prev.map((s) => (s.slotId === slotId ? { ...s, grades: schedule.grades, conflitos: schedule.conflitos, updatedAt: agora } : s)))
  }

  const handleCarregarSlot = (slotId: number) => {
    const slot = slots.find((s) => s.slotId === slotId)
    if (!slot?.grades) return
    setSchedule({ grades: slot.grades, conflitos: slot.conflitos })
    setModalSlotsAberto(false)
  }

  const handleRenomearSlot = (slotId: number, novoNome: string) => {
    const nomeFinal = novoNome.trim() || `Horário ${slotId}`
    setSlots((prev) => prev.map((s) => (s.slotId === slotId ? { ...s, nome: nomeFinal } : s)))
    // slot ainda vazio: só guarda o nome localmente, persiste quando "Salvar aqui" for clicado.
    if (!user || !slots.find((s) => s.slotId === slotId)?.grades) return
    supabase
      .from("horarios_gerados")
      .update({ nome: nomeFinal })
      .eq("user_id", user.id)
      .eq("slot_id", slotId)
      .then(({ error }) => {
        if (error) console.error("Erro ao renomear slot:", error)
      })
  }

  const handleMoveAssignment = (turmaId: string, fromDia: number, fromBloco: number, toDia: number, toBloco: number) => {
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
          <button
            type="button"
            onClick={() => setTab("inicio")}
            className="group flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-brand-500/30 transition-transform duration-300 group-hover:rotate-6">
              <img src="/images/icon.png" alt="" className="h-full w-full object-cover" />
            </span>
            {APP_NAME}
          </button>

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
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        {/* Menu horizontal, nessa ordem: Início, Cadastros, Controles, Relatórios (dropdown),
            Configurações, Horário, Exportar (diretos), Administração (admin). */}
        <div className="border-t border-slate-100 dark:border-white/5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-1.5 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setTab("inicio")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "inicio"
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              Início
            </button>
            <MenuDropdown label="Cadastros" itens={[...MENU_CADASTROS]} tabAtual={tab} onSelect={(id) => setTab(id as TabId)} />
            <MenuDropdown label="Controles" itens={[...MENU_CONTROLES]} tabAtual={tab} onSelect={(id) => setTab(id as TabId)} />
            <MenuDropdown label="Relatórios" itens={[...MENU_RELATORIOS]} tabAtual={tab} onSelect={(id) => setTab(id as TabId)} />
            <button
              type="button"
              onClick={() => setTab("configuracoes")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "configuracoes"
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              Configurações
            </button>
            <button
              type="button"
              onClick={() => setTab("grade-escolar")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "grade-escolar"
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              Horário
            </button>
            <button
              type="button"
              onClick={() => setTab("exportar")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "exportar"
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              Exportar
            </button>
            {user.role === "admin" && (
              <button
                type="button"
                onClick={() => setTab("admin")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === "admin"
                    ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <Shield className="h-4 w-4" />
                Administração
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 print:hidden dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 lg:hidden">
          <Monitor className="h-4 w-4 shrink-0" />
          Pra melhor visualização, acesse pelo computador — o celular ainda tá em ajustes.
        </div>

        <section className="min-w-0 space-y-6">
          {tab === "inicio" && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Bem-vindo ao {APP_NAME}, {user.name.split(" ")[0]}
                </h1>
                {user.nomeInstituicao && (
                  <p className="mt-0.5 text-sm font-medium text-brand-600 dark:text-brand-400">{user.nomeInstituicao}</p>
                )}
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Escolha um menu acima pra começar: cadastre turmas/disciplinas/professores em
                  "Cadastros", depois gere a grade em "Horário".
                </p>
              </div>

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

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTab("turmas")}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-300 dark:border-white/10 dark:bg-slate-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    <UsersIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-white">Cadastros</span>
                    <span className="block text-xs text-slate-400">Turmas, disciplinas, professores e carga horária</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("grade-escolar")}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand-300 dark:border-white/10 dark:bg-slate-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-white">Horário</span>
                    <span className="block text-xs text-slate-400">Gerar e ajustar a grade escolar</span>
                  </span>
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">Horários salvos</h2>
                  <button
                    type="button"
                    onClick={() => setModalSlotsAberto(true)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Gerenciar
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {slots.map((slot) => {
                    const ocupado = slot.grades !== null
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => {
                          if (ocupado) {
                            handleCarregarSlot(slot.slotId)
                            setTab("grade-escolar")
                          } else {
                            setModalSlotsAberto(true)
                          }
                        }}
                        className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                          ocupado
                            ? "border-slate-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-slate-900"
                            : "border-dashed border-slate-200 bg-white/50 hover:border-brand-300 dark:border-slate-700 dark:bg-white/2"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            ocupado
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300"
                              : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                          }`}
                        >
                          {ocupado ? <FolderOpen className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </span>
                        <span className="w-full min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800 dark:text-white">{slot.nome}</span>
                          <span className="block text-xs text-slate-400">
                            {ocupado ? formatarDataSlot(slot.updatedAt) : "Vazio — clique pra salvar"}
                          </span>
                          {ocupado && slot.conflitos.length > 0 && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> {slot.conflitos.length} conflito{slot.conflitos.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {tab === "tipos-especificos" && <TiposEspecificosManager />}
          {tab === "fixar-aulas" && <FixarAulasManager />}
          {tab === "limitar-horarios" && <LimitarHorariosManager />}
          {tab === "coincidir-aulas" && <CoincidirAulasManager />}
          {tab === "limitar-grupo-disciplinas" && <LimitarGrupoDisciplinasManager />}
          {tab === "recursos" && <RecursosManager />}

            {tab === "carga-horaria" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Carga horária semanal</h2>
                <p className="mb-4 text-xs text-slate-400">
                  Aulas por semana de cada disciplina, por turma. Clique no ícone de link pra tentar geminar (2 aulas seguidas no mesmo dia).
                </p>

                {turmas.length === 0 || disciplinas.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
                    <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                    {turmas.length === 0 ? "Crie uma turma para começar." : "Cadastre uma disciplina para começar."}
                  </div>
                ) : (
                  <div className="max-h-128 overflow-auto rounded-xl border border-slate-200 dark:border-white/10">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="sticky left-0 top-0 z-20 min-w-40 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                            Disciplina
                          </th>
                          {turmas.map((t) => (
                            <th
                              key={t.id}
                              className="sticky top-0 z-10 min-w-20 border-b border-l border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
                            >
                              {t.nome}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...disciplinas]
                          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                          .map((d) => (
                            <tr key={d.id} className="group">
                              <td
                                className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-1.5 text-left font-medium text-slate-700 dark:border-white/5 dark:bg-slate-900 dark:text-slate-200"
                                style={{ borderLeft: `3px solid ${d.cor}` }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">{d.nome}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const valor = turmas[0]?.cargaHoraria[d.id] ?? 0
                                      turmas.forEach((t) => updateCargaHoraria(t.id, d.id, valor))
                                    }}
                                    title={`Aplicar o valor de "${turmas[0]?.nome}" a todas as turmas`}
                                    className="shrink-0 rounded-md p-1 text-slate-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-brand-600 group-hover:opacity-100 dark:hover:bg-white/10"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              {turmas.map((t) => {
                                const valor = t.cargaHoraria[d.id] ?? 0
                                const geminada = t.cargaHorariaGeminada[d.id] ?? false
                                return (
                                  <td key={t.id} className="border-b border-l border-slate-100 p-0.5 dark:border-white/5">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <input
                                        type="number"
                                        min={0}
                                        value={valor === 0 ? "" : valor}
                                        onChange={(e) => {
                                          const v = e.target.value
                                          updateCargaHoraria(t.id, d.id, v === "" ? 0 : Math.max(0, parseInt(v, 10)))
                                        }}
                                        placeholder="—"
                                        className="w-10 rounded-md border border-transparent bg-transparent py-1 text-center text-sm text-slate-700 outline-none focus:border-brand-400 focus:bg-brand-50/50 focus:ring-1 focus:ring-brand-400 dark:text-white dark:focus:bg-brand-950/30"
                                      />
                                      {valor > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => updateCargaHorariaGeminada(t.id, d.id, !geminada)}
                                          title="Tenta encaixar 2 aulas seguidas no mesmo dia em vez de espalhadas"
                                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors ${
                                            geminada
                                              ? "text-brand-600 dark:text-brand-400"
                                              : "text-slate-200 hover:text-slate-400 dark:text-slate-700 dark:hover:text-slate-500"
                                          }`}
                                        >
                                          <Link2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="sticky left-0 z-10 border-t-2 border-r border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                            Total
                          </td>
                          {turmas.map((t) => {
                            const total = disciplinas.reduce((soma, d) => soma + (t.cargaHoraria[d.id] ?? 0), 0)
                            return (
                              <td
                                key={t.id}
                                className="border-t-2 border-l border-slate-200 bg-slate-50 px-2 py-2 text-center font-display text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                              >
                                {total}
                              </td>
                            )
                          })}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
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
                    <button
                      type="button"
                      onClick={() => setModalSlotsAberto(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
                    >
                      <Save className="h-4 w-4" />
                      Horários salvos
                    </button>
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
            {tab === "configuracoes" && (
              <>
                <InstituicaoManager />
                <BlocosManager />
              </>
            )}

            {tab === "exportar" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Exportar</h2>
                <p className="mb-4 text-xs text-slate-400">
                  Baixa um Excel com uma planilha por turma (grade completa) e uma por professor (só as aulas dele,
                  juntando todas as turmas que ele dá aula) — fácil de ajustar e imprimir do jeito que quiser.
                </p>
                {schedule ? (
                  <div className="space-y-3">
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
                        {exportando === "todos" ? "Gerando..." : "Exportar todos (.xlsx)"}
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
                        {exportando === "professores" ? "Gerando..." : "Exportar professores (.xlsx)"}
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
                        {exportando === "alunos" ? "Gerando..." : "Exportar alunos (.xlsx)"}
                      </button>
                    </div>

                    <div>
                      <p className="mb-1.5 text-xs text-slate-400">
                        Máscara em Word (um quadro por professor/turma, cor por disciplina, igual grade impressa):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setExportando("word-professores")
                            try {
                              const { exportarWordProfessores } = await import("@/lib/exportWord")
                              await exportarWordProfessores(turmas, professores, disciplinas, blocos, schedule)
                            } finally {
                              setExportando(null)
                            }
                          }}
                          disabled={exportando !== null}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                        >
                          <FileText className="h-4 w-4" />
                          {exportando === "word-professores" ? "Gerando..." : "Máscara dos professores (.docx)"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setExportando("word-turmas")
                            try {
                              const { exportarWordTurmas } = await import("@/lib/exportWord")
                              await exportarWordTurmas(turmas, professores, disciplinas, blocos, schedule)
                            } finally {
                              setExportando(null)
                            }
                          }}
                          disabled={exportando !== null}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300"
                        >
                          <FileText className="h-4 w-4" />
                          {exportando === "word-turmas" ? "Gerando..." : "Máscara das turmas (.docx)"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Gere os horários na aba "Grade Escolar" primeiro pra poder exportar.
                  </p>
                )}
              </div>
            )}

            {tab === "relatorios-turmas-individual" && <RelatoriosManager schedule={schedule} modo="turmas" escopo="individual" />}
            {tab === "relatorios-turmas-geral" && <RelatoriosManager schedule={schedule} modo="turmas" escopo="geral" />}
            {tab === "relatorios-professores-individual" && <RelatoriosManager schedule={schedule} modo="professores" escopo="individual" />}
            {tab === "relatorios-professores-geral" && <RelatoriosManager schedule={schedule} modo="professores" escopo="geral" />}

            {tab === "admin" && user.role === "admin" && <AdminPanel />}
          </section>
      </main>

      <SavedSchedulesModal
        aberto={modalSlotsAberto}
        onClose={() => setModalSlotsAberto(false)}
        slots={slots}
        temHorarioAtual={schedule !== null}
        onSalvar={handleSalvarSlot}
        onCarregar={handleCarregarSlot}
        onRenomear={handleRenomearSlot}
      />
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
              <span className="text-xs text-slate-400">{Object.keys(p.turmasPorDisciplina).join(", ")}</span>
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
