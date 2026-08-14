import { useState } from "react"
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react"
import { useData } from "@/context/DataContext"
import type { GrupoCoincidencia } from "@/data/mockData"

/**
 * "Coincidir aulas de turmas diferentes" (Controles → Turmas): as turmas de
 * um grupo têm a mesma disciplina no mesmo dia/horário (cada uma pode ter
 * um professor diferente) — ver `buscarSlotCoincidenteExaustivo` em
 * scheduleGenerator.ts.
 */
export function CoincidirAulasManager() {
  const { gruposCoincidencia, setGruposCoincidencia, turmas, disciplinas } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  const selecionado = gruposCoincidencia.find((g) => g.id === selectedId) ?? null

  const updateGrupo = (id: string, changes: Partial<GrupoCoincidencia>) => {
    setGruposCoincidencia(gruposCoincidencia.map((g) => (g.id === id ? { ...g, ...changes } : g)))
  }

  const handleNovo = () => {
    const id = `gc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setGruposCoincidencia([
      ...gruposCoincidencia,
      { id, nome: `Grupo ${gruposCoincidencia.length + 1}`, disciplinaId: disciplinas[0]?.id ?? "", turmaIds: [] },
    ])
    setSelectedId(id)
  }

  const handleRemover = (id: string) => {
    setGruposCoincidencia(gruposCoincidencia.filter((g) => g.id !== id))
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
    setGruposCoincidencia(gruposCoincidencia.filter((g) => !selecionadas.has(g.id)))
    if (selectedId && selecionadas.has(selectedId)) setSelectedId(null)
    sairDoModoSelecao()
  }

  const toggleTurma = (grupo: GrupoCoincidencia, turmaId: string) => {
    const next = grupo.turmaIds.includes(turmaId) ? grupo.turmaIds.filter((id) => id !== turmaId) : [...grupo.turmaIds, turmaId]
    updateGrupo(grupo.id, { turmaIds: next })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Coincidir aulas</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Turmas de um grupo têm a mesma disciplina sempre no mesmo dia/horário (cada uma pode ter um professor
        diferente) — útil pra juntar ou dividir alunos de turmas diferentes numa atividade em comum.
      </p>

      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Lista */}
        <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${selecionado ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 p-2.5 dark:border-white/5">
            <button
              type="button"
              onClick={handleNovo}
              disabled={disciplinas.length === 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Novo grupo
            </button>
            <button
              type="button"
              onClick={() => (modoSelecao ? sairDoModoSelecao() : setModoSelecao(true))}
              aria-label={modoSelecao ? "Cancelar seleção" : "Selecionar vários"}
              title={modoSelecao ? "Cancelar seleção" : "Selecionar vários"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                modoSelecao ? "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
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
                {confirmandoExclusao ? `Confirmar exclusão (${selecionadas.size})` : `Excluir selecionados (${selecionadas.size})`}
              </button>
            </div>
          )}

          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {gruposCoincidencia.map((g) => {
              const marcada = selecionadas.has(g.id)
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => (modoSelecao ? toggleSelecionada(g.id) : setSelectedId(g.id))}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    !modoSelecao && selectedId === g.id
                      ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                  }`}
                >
                  {modoSelecao && (
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        marcada ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {marcada && <Check className="h-3 w-3" />}
                    </span>
                  )}
                  <span className="flex-1 truncate">{g.nome || "Sem nome"}</span>
                  <span className={`shrink-0 text-xs ${!modoSelecao && selectedId === g.id ? "text-white/70" : "text-slate-400"}`}>
                    {g.turmaIds.length} turma{g.turmaIds.length !== 1 ? "s" : ""}
                  </span>
                </button>
              )
            })}
            {gruposCoincidencia.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Nenhum grupo cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Detalhe */}
        <div
          className={
            selecionado
              ? ""
              : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"
          }
        >
          {!selecionado && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              {disciplinas.length === 0
                ? "Cadastre disciplinas antes de criar um grupo."
                : 'Selecione um grupo à esquerda, ou clique em "Novo grupo" pra cadastrar.'}
            </p>
          )}

          {selecionado && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Voltar pra lista
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  value={selecionado.nome}
                  onChange={(e) => updateGrupo(selecionado.id, { nome: e.target.value })}
                  placeholder="Nome do grupo"
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-lg font-semibold text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => handleRemover(selecionado.id)}
                  aria-label="Excluir grupo"
                  title="Excluir grupo"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Disciplina em comum</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {disciplinas.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updateGrupo(selecionado.id, { disciplinaId: d.id })}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        selecionado.disciplinaId === d.id
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
                      {d.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Turmas do grupo
                  {selecionado.turmaIds.length > 0 && <span className="font-normal text-slate-400"> ({selecionado.turmaIds.length})</span>}
                </span>
                <p className="mb-1.5 text-[11px] text-slate-400">Pelo menos 2 turmas — todas ficam com a disciplina no mesmo horário.</p>
                <div className="flex flex-wrap gap-1.5">
                  {turmas.map((t) => {
                    const ativa = selecionado.turmaIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTurma(selecionado, t.id)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          ativa
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                            : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                        }`}
                      >
                        {t.nome}
                      </button>
                    )
                  })}
                  {turmas.length === 0 && <span className="text-[11px] text-slate-400">Cadastre turmas primeiro.</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
