import { useState } from "react"
import { Check, ChevronRight, ListChecks, Plus, Trash2, X } from "lucide-react"
import { useData } from "@/context/DataContext"

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

export function MateriasManager() {
  const { disciplinas, setDisciplinas, turmas } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const selecionada = disciplinas.find((d) => d.id === selectedId) ?? null
  const emUso = (id: string) => turmas.some((t) => (t.cargaHoraria[id] ?? 0) > 0)

  const updateDisciplina = (id: string, changes: { nome?: string; cor?: string; nomeAbreviado?: string; tipo?: string }) => {
    setDisciplinas(disciplinas.map((d) => (d.id === id ? { ...d, ...changes } : d)))
  }

  const handleNova = () => {
    const id = `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setDisciplinas([
      ...disciplinas,
      { id, nome: `Disciplina ${disciplinas.length + 1}`, cor: PALETA_CORES[disciplinas.length % PALETA_CORES.length] },
    ])
    setSelectedId(id)
  }

  const handleRemover = (id: string) => {
    setDisciplinas(disciplinas.filter((d) => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const sairDoModoSelecao = () => {
    setModoSelecao(false)
    setSelecionadas(new Set())
    setConfirmandoExclusao(false)
  }

  const toggleSelecionada = (id: string) => {
    setConfirmandoExclusao(false)
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExcluirSelecionadas = () => {
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true)
      return
    }
    setDisciplinas(disciplinas.filter((d) => !selecionadas.has(d.id)))
    if (selectedId && selecionadas.has(selectedId)) setSelectedId(null)
    sairDoModoSelecao()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Disciplinas</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">A lista usada pelo gerador e pela carga horária de cada turma.</p>

      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Lista */}
        <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${selecionada ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 p-2.5 dark:border-white/5">
            <button
              type="button"
              onClick={handleNova}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Nova disciplina
            </button>
            <button
              type="button"
              onClick={() => (modoSelecao ? sairDoModoSelecao() : setModoSelecao(true))}
              aria-label={modoSelecao ? "Cancelar seleção" : "Selecionar várias"}
              title={modoSelecao ? "Cancelar seleção" : "Selecionar várias"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                modoSelecao
                  ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {modoSelecao ? <X className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
            </button>
          </div>

          {modoSelecao && (
            <div className="border-b border-slate-100 p-2.5 dark:border-white/5">
              <button
                type="button"
                onClick={handleExcluirSelecionadas}
                disabled={selecionadas.size === 0}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  confirmandoExclusao
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmandoExclusao ? `Confirmar exclusão (${selecionadas.size})` : `Excluir selecionadas (${selecionadas.size})`}
              </button>
            </div>
          )}

          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {disciplinas.map((d) => {
              const marcada = selecionadas.has(d.id)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => (modoSelecao ? toggleSelecionada(d.id) : setSelectedId(d.id))}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    !modoSelecao && selectedId === d.id
                      ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  {modoSelecao ? (
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        marcada ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {marcada && <Check className="h-3 w-3" />}
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
                  )}
                  <span className="flex-1 truncate">{d.nome || "Sem nome"}</span>
                  {!modoSelecao && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                </button>
              )
            })}
            {disciplinas.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Nenhuma disciplina cadastrada ainda.</p>
            )}
          </div>

          <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-white/5">
            {disciplinas.length} {disciplinas.length === 1 ? "disciplina cadastrada" : "disciplinas cadastradas"}
          </p>
        </div>

        {/* Detalhe */}
        <div className={selecionada ? "" : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"}>
          {!selecionada && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              Selecione uma disciplina à esquerda, ou clique em "Nova disciplina" pra cadastrar.
            </p>
          )}

          {selecionada && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Voltar pra lista
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  value={selecionada.nome}
                  onChange={(e) => updateDisciplina(selecionada.id, { nome: e.target.value })}
                  placeholder="Nome da disciplina"
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-lg font-semibold text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => handleRemover(selecionada.id)}
                  aria-label="Excluir disciplina"
                  title="Excluir disciplina"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {emUso(selecionada.id) && (
                <p className="text-[11px] text-slate-400">Usada na carga horária de alguma turma.</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Nome abreviado</span>
                  <input
                    value={selecionada.nomeAbreviado ?? ""}
                    onChange={(e) => updateDisciplina(selecionada.id, { nomeAbreviado: e.target.value })}
                    placeholder="Ex: MAT"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tipo</span>
                  <input
                    value={selecionada.tipo ?? ""}
                    onChange={(e) => updateDisciplina(selecionada.id, { tipo: e.target.value })}
                    placeholder="Ex: Regular"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </label>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cor</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {PALETA_CORES.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => updateDisciplina(selecionada.id, { cor })}
                      aria-label={`Cor ${cor}`}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        selecionada.cor === cor ? "scale-110 ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-slate-900" : ""
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
