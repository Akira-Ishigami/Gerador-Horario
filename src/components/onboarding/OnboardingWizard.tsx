import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogOut,
  Minus,
  Plus,
  School,
  Trash2,
  Users,
} from "lucide-react"
import {
  DIAS_SEMANA,
  DIAS_SEMANA_COMPLETA,
  PERIODOS,
  type DiaSemana,
  type Disciplina,
  type Periodo,
  type Professor,
} from "@/data/mockData"
import { useAuth } from "@/context/AuthContext"
import { useData } from "@/context/DataContext"
import { APP_NAME } from "@/config/branding"

interface WizardTurma {
  nome: string
  periodo: Periodo
  sala: string
  cargaHoraria: Record<string, number>
  dias: DiaSemana[]
}

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/** índices de turmas cujo nome (aparado, sem diferenciar maiúsculas) se repete em outra turma da lista */
function indicesNomeDuplicado(turmas: WizardTurma[]): Set<number> {
  const contagem = new Map<string, number>()
  for (const t of turmas) {
    const chave = t.nome.trim().toLowerCase()
    if (!chave) continue
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  const duplicados = new Set<number>()
  turmas.forEach((t, i) => {
    const chave = t.nome.trim().toLowerCase()
    if (chave && (contagem.get(chave) ?? 0) > 1) duplicados.add(i)
  })
  return duplicados
}

const PALETA_CORES = [
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#84cc16",
]

const STEPS = [
  { label: "Instituição", icon: School },
  { label: "Turmas", icon: Users },
  { label: "Disciplinas", icon: BookOpen },
  { label: "Professores", icon: GraduationCap },
  { label: "Dias", icon: CalendarDays },
  { label: "Revisão", icon: CheckCircle2 },
]

function novaTurmaWizard(): WizardTurma {
  return { nome: "", periodo: "matutino", sala: "", cargaHoraria: {}, dias: [...DIAS_SEMANA] }
}

interface OnboardingWizardProps {
  onFinish: () => void
}

export function OnboardingWizard({ onFinish }: OnboardingWizardProps) {
  const { user, logout, updateNomeInstituicao } = useAuth()
  const {
    addTurma,
    setProfessores: saveProfessores,
    setDisciplinas: saveDisciplinas,
    maxTurmas,
    professores: professoresAtuais,
    disciplinas: disciplinasAtuais,
  } = useData()

  // null = sem limite (fase piloto ou plano ilimitado) — Infinity faz Math.min/comparações
  // abaixo não impor teto nenhum, igual o "∞" que o TurmasManager já mostra pra esse caso.
  const maxCount = maxTurmas ?? Infinity
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [nomeInstituicao, setNomeInstituicao] = useState(user?.nomeInstituicao ?? "")
  const [turmas, setTurmas] = useState<WizardTurma[]>([novaTurmaWizard()])
  const [professores, setProfessoresWizard] = useState<Professor[]>(
    professoresAtuais.length > 0 ? professoresAtuais.map((p) => ({ ...p })) : [],
  )
  const [disciplinas, setDisciplinasWizard] = useState<Disciplina[]>(disciplinasAtuais.map((d) => ({ ...d })))

  const setCount = (n: number) => {
    const clamped = Math.max(1, Math.min(maxCount, n))
    setTurmas((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, novaTurmaWizard)]
      }
      return prev.slice(0, clamped)
    })
  }

  const updateTurma = (index: number, next: WizardTurma) => {
    setTurmas((prev) => prev.map((t, i) => (i === index ? next : t)))
  }

  const updateProfessor = (index: number, next: Professor) => {
    setProfessoresWizard((prev) => prev.map((p, i) => (i === index ? next : p)))
  }

  const addProfessor = () => {
    setProfessoresWizard((prev) => [
      ...prev,
      { id: `p-novo-${Date.now()}-${prev.length}`, nome: "", turmasPorDisciplina: {}, indisponibilidades: [] },
    ])
  }

  const removeProfessor = (index: number) => {
    setProfessoresWizard((prev) => prev.filter((_, i) => i !== index))
  }

  const addDisciplina = (nome: string) => {
    const trimmed = nome.trim()
    if (!trimmed) return
    setDisciplinasWizard((prev) => [
      ...prev,
      { id: `d-novo-${Date.now()}`, nome: trimmed, cor: PALETA_CORES[prev.length % PALETA_CORES.length] },
    ])
  }

  const removeDisciplina = (index: number) => {
    setDisciplinasWizard((prev) => prev.filter((_, i) => i !== index))
  }

  const canContinue = () => {
    if (step === 1) return nomeInstituicao.trim().length > 0
    if (step === 2) return turmas.every((t) => t.nome.trim().length > 0) && indicesNomeDuplicado(turmas).size === 0
    if (step === 4) return professores.some((p) => p.nome.trim().length > 0)
    return true
  }

  const avisoTurmas = (() => {
    if (step !== 2) return null
    if (turmas.some((t) => !t.nome.trim())) return "Preencha o nome de todas as turmas para continuar."
    if (indicesNomeDuplicado(turmas).size > 0) return "Duas turmas não podem ter o mesmo nome — ajuste os nomes destacados abaixo."
    return null
  })()

  const applyTurnoATodas = (periodo: Periodo) => {
    setTurmas((prev) => prev.map((t) => ({ ...t, periodo })))
  }

  const preencherNomesSequenciais = (base: string) => {
    const b = base.trim()
    if (!b) return
    setTurmas((prev) => prev.map((t, i) => ({ ...t, nome: `${b} ${LETRAS[i] ?? i + 1}` })))
  }

  const goNext = () => {
    if (step >= 6) return
    setLoading(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setLoading(false)
    }, 550)
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  const handleFinish = () => {
    void updateNomeInstituicao(nomeInstituicao)
    turmas.forEach((t) => {
      addTurma({
        nome: t.nome.trim(),
        turno: t.periodo,
        sala: t.sala.trim() || undefined,
        cargaHoraria: t.cargaHoraria,
        cargaHorariaGeminada: {},
        diasFuncionamento: t.dias,
        aulasFixas: [],
      })
    })
    saveProfessores(professores.filter((p) => p.nome.trim().length > 0))
    saveDisciplinas(disciplinas)
    onFinish()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-brand-500/30">
              <img src="/images/icon.png" alt="" className="h-full w-full object-cover" />
            </span>
            {APP_NAME}
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  i + 1 < step
                    ? "border-brand-500 bg-brand-500 text-white"
                    : i + 1 === step
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600"
                }`}
              >
                {i + 1 < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-brand-500 to-accent-500"
            animate={{ width: `${(step / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400"
              >
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                <p className="text-sm">Preparando o próximo passo...</p>
              </motion.div>
            ) : (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && <StepInstituicao nome={nomeInstituicao} onChange={setNomeInstituicao} />}
                {step === 2 && (
                  <StepTurmas
                    turmas={turmas}
                    maxCount={maxCount}
                    onCountChange={setCount}
                    onChangeTurma={updateTurma}
                    onApplyTurnoATodas={applyTurnoATodas}
                    onPreencherNomes={preencherNomesSequenciais}
                    nomesDuplicados={indicesNomeDuplicado(turmas)}
                  />
                )}
                {step === 3 && (
                  <StepMaterias
                    turmas={turmas}
                    disciplinas={disciplinas}
                    onChangeTurma={updateTurma}
                    onAddDisciplina={addDisciplina}
                    onRemoveDisciplina={removeDisciplina}
                  />
                )}
                {step === 4 && (
                  <StepProfessores
                    professores={professores}
                    disciplinas={disciplinas}
                    onChange={updateProfessor}
                    onAdd={addProfessor}
                    onRemove={removeProfessor}
                  />
                )}
                {step === 5 && <StepDias turmas={turmas} onChangeTurma={updateTurma} />}
                {step === 6 && <StepRevisao turmas={turmas} professores={professores} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!loading && avisoTurmas && (
          <p className="mt-4 text-center text-xs font-medium text-amber-600 dark:text-amber-400">{avisoTurmas}</p>
        )}

        {!loading && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-0 dark:border-slate-700 dark:text-slate-300"
            >
              Voltar
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue()}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.02] hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-600 to-accent-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.02]"
              >
                <CheckCircle2 className="h-4 w-4" /> Concluir e começar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StepInstituicao({ nome, onChange }: { nome: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Qual o nome da sua instituição?</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Usamos isso só pra identificar sua escola dentro do {APP_NAME} — pode ajustar depois.
      </p>
      <label className="mt-6 block text-xs font-medium text-slate-500 dark:text-slate-400">Nome da instituição</label>
      <input
        value={nome}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Escola Municipal João de Barro"
        autoFocus
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      />
    </div>
  )
}

function StepTurmas({
  turmas,
  maxCount,
  onCountChange,
  onChangeTurma,
  onApplyTurnoATodas,
  onPreencherNomes,
  nomesDuplicados,
}: {
  turmas: WizardTurma[]
  maxCount: number
  onCountChange: (n: number) => void
  onChangeTurma: (i: number, t: WizardTurma) => void
  onApplyTurnoATodas: (periodo: Periodo) => void
  onPreencherNomes: (base: string) => void
  nomesDuplicados: Set<number>
}) {
  const [nomeBase, setNomeBase] = useState("")

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Quantas turmas sua escola tem?</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Conta rapidinho — depois dá pra adicionar mais turmas quando quiser.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onCountChange(turmas.length - 1)}
          disabled={turmas.length <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-white/5"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          max={Number.isFinite(maxCount) ? maxCount : undefined}
          value={turmas.length}
          onChange={(e) => {
            const valor = parseInt(e.target.value, 10)
            if (!Number.isNaN(valor)) onCountChange(valor)
          }}
          aria-label="Quantidade de turmas"
          className="w-20 rounded-lg border border-transparent bg-transparent text-center font-display text-4xl font-bold text-brand-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:text-brand-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onCountChange(turmas.length + 1)}
          disabled={turmas.length >= maxCount}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-white/5"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="text-sm text-slate-400">{turmas.length === 1 ? "turma" : "turmas"}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {Number.isFinite(maxCount) ? (
          <>
            Seu plano permite até {maxCount} turma{maxCount > 1 ? "s" : ""}.
          </>
        ) : (
          "Sem limite de turmas nesta fase piloto."
        )}
      </p>

      {turmas.length > 1 && (
        <div className="mt-6 grid gap-3 rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Preencher nomes de uma vez
            </label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                value={nomeBase}
                onChange={(e) => setNomeBase(e.target.value)}
                placeholder="Ex: 6º Ano"
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onPreencherNomes(nomeBase)}
                disabled={!nomeBase.trim()}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Aplicar A, B, C...
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Turno padrão pra todas</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onApplyTurnoATodas(p)}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium capitalize text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {turmas.map((t, i) => {
          const duplicado = nomesDuplicados.has(i)
          return (
            <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nome da turma {i + 1}</label>
                {duplicado && <span className="text-[11px] font-medium text-rose-500">nome repetido</span>}
              </div>
              <input
                value={t.nome}
                onChange={(e) => onChangeTurma(i, { ...t, nome: e.target.value })}
                placeholder="Ex: 6º Ano A"
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 dark:bg-slate-950 dark:text-white ${
                  duplicado
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700"
                }`}
              />

              <label className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400">
                Sala/ambiente (opcional)
              </label>
              <input
                value={t.sala}
                onChange={(e) => onChangeTurma(i, { ...t, sala: e.target.value })}
                placeholder="Ex: Sala 12"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PERIODOS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChangeTurma(i, { ...t, periodo: p })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      t.periodo === p
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                        : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StepMaterias({
  turmas,
  disciplinas,
  onChangeTurma,
  onAddDisciplina,
  onRemoveDisciplina,
}: {
  turmas: WizardTurma[]
  disciplinas: Disciplina[]
  onChangeTurma: (i: number, t: WizardTurma) => void
  onAddDisciplina: (nome: string) => void
  onRemoveDisciplina: (i: number) => void
}) {
  const [novaMateria, setNovaMateria] = useState("")

  const handleAdd = () => {
    if (!novaMateria.trim()) return
    onAddDisciplina(novaMateria)
    setNovaMateria("")
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
        Quantas aulas por semana em cada disciplina?
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Uma tabela só — preenche a carga horária de todas as turmas de uma vez. Não achou a disciplina? Adicione abaixo.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full min-w-160 border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5">
              <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                Turma
              </th>
              {disciplinas.map((d, di) => (
                <th
                  key={d.id}
                  className="group border-b border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300"
                >
                  <span className="inline-flex items-center gap-1">
                    {d.nome}
                    <button
                      type="button"
                      onClick={() => onRemoveDisciplina(di)}
                      aria-label={`Remover ${d.nome}`}
                      className="text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turmas.map((t, i) => (
              <tr key={i}>
                <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-700 dark:border-white/5 dark:text-slate-200">
                  {t.nome || `Turma ${i + 1}`}
                </td>
                {disciplinas.map((d) => {
                  const valor = t.cargaHoraria[d.id] ?? 0
                  return (
                    <td key={d.id} className="border-b border-l border-slate-100 p-1 text-center dark:border-white/5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeTurma(i, {
                              ...t,
                              cargaHoraria: { ...t.cargaHoraria, [d.id]: Math.max(0, valor - 1) },
                            })
                          }
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="w-4 font-semibold text-slate-700 dark:text-white">{valor}</span>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeTurma(i, { ...t, cargaHoraria: { ...t.cargaHoraria, [d.id]: valor + 1 } })
                          }
                          className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={novaMateria}
          onChange={(e) => setNovaMateria(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Ex: Filosofia, Redação, Robótica..."
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
        >
          <Plus className="h-4 w-4" /> Adicionar disciplina
        </button>
      </div>
    </div>
  )
}

function StepProfessores({
  professores,
  disciplinas,
  onChange,
  onAdd,
  onRemove,
}: {
  professores: Professor[]
  disciplinas: Disciplina[]
  onChange: (i: number, p: Professor) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Quem são os professores?</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Digite o nome de cada professor e marque quais disciplinas ele(a) dá.
      </p>

      <div className="mt-6 space-y-3">
        {professores.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={p.nome}
                onChange={(e) => onChange(i, { ...p, nome: e.target.value })}
                placeholder="Nome do professor"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Remover professor"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {disciplinas.map((d) => {
                const active = d.id in p.turmasPorDisciplina
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      const next = { ...p.turmasPorDisciplina }
                      if (active) delete next[d.id]
                      else next[d.id] = { turmaIds: [], tipo: "A" }
                      onChange(i, { ...p, turmasPorDisciplina: next })
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                        : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {d.nome}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {professores.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhum professor ainda — adicione o primeiro abaixo.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
      >
        <Plus className="h-4 w-4" /> Adicionar professor
      </button>
    </div>
  )
}

function StepDias({
  turmas,
  onChangeTurma,
}: {
  turmas: WizardTurma[]
  onChangeTurma: (i: number, t: WizardTurma) => void
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Quais dias cada turma tem aula?</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Marque os dias da semana em que cada turma funciona.
      </p>
      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
        Por enquanto a grade gerada considera Segunda a Sexta — o Sábado fica salvo para quando isso for suportado.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/5">
              <th className="border-b border-slate-200 px-3 py-2 font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                Turma
              </th>
              {DIAS_SEMANA_COMPLETA.map((d) => (
                <th
                  key={d}
                  className="border-b border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {turmas.map((t, i) => (
              <tr key={i}>
                <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-700 dark:border-white/5 dark:text-slate-200">
                  {t.nome || `Turma ${i + 1}`}
                </td>
                {DIAS_SEMANA_COMPLETA.map((d) => {
                  const checked = t.dias.includes(d)
                  return (
                    <td key={d} className="border-b border-l border-slate-100 p-1 text-center dark:border-white/5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? t.dias.filter((x) => x !== d) : [...t.dias, d]
                          onChangeTurma(i, { ...t, dias: next })
                        }}
                        className="h-4 w-4 rounded accent-brand-600"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StepRevisao({ turmas, professores }: { turmas: WizardTurma[]; professores: Professor[] }) {
  const professoresValidos = professores.filter((p) => p.nome.trim().length > 0)

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Confere se tá tudo certo</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Dá pra voltar e ajustar qualquer passo antes de concluir.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {turmas.map((t, i) => {
          const totalAulas = Object.values(t.cargaHoraria).reduce((a, b) => a + b, 0)
          return (
            <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="font-display font-semibold text-slate-900 dark:text-white">{t.nome || `Turma ${i + 1}`}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">
                {t.periodo} · {t.dias.length} dia{t.dias.length !== 1 ? "s" : ""}/semana
                {t.sala.trim() && <> · {t.sala.trim()}</>}
              </p>
              <p className="mt-1 text-xs text-slate-400">{totalAulas} aula{totalAulas !== 1 ? "s" : ""}/semana no total</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Professores ({professoresValidos.length})
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {professoresValidos.length > 0 ? professoresValidos.map((p) => p.nome).join(", ") : "Nenhum cadastrado ainda."}
        </p>
      </div>
    </div>
  )
}
