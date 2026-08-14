import { useState } from "react"
import { BookOpen, CalendarOff, Check, ChevronRight, ListChecks, Plus, Trash2, X } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA, PERIODOS, type DiaSemana, type Periodo, type Professor } from "@/data/mockData"
import { MateriasProfessorModal } from "@/components/dashboard/MateriasProfessorModal"

const TURNO_LABEL: Record<Periodo, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
}

export function ProfessoresManager() {
  const { professores, setProfessores, disciplinas, turmas, blocos } = useData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [turnoSelecionado, setTurnoSelecionado] = useState<Record<string, Periodo>>({})
  const [modalProfessorId, setModalProfessorId] = useState<string | null>(null)

  const selecionado = professores.find((p) => p.id === selectedId) ?? null

  const updateProfessor = (id: string, changes: Partial<Professor>) => {
    setProfessores(professores.map((p) => (p.id === id ? { ...p, ...changes } : p)))
  }

  /** turnos em que o professor pode efetivamente dar aula — todos os configurados se alguma disciplina não tiver restrição de turma, senão o turno das turmas que aparecem em qualquer disciplina dele */
  const turnosDoProfessor = (p: Professor): Periodo[] => {
    const configs = Object.values(p.turmasPorDisciplina)
    const semRestricao = configs.length === 0 || configs.some((c) => c.turmaIds.length === 0)
    if (semRestricao) {
      return PERIODOS.filter((turno) => blocos.some((b) => b.turno === turno && b.tipo === "aula"))
    }
    const turmaIdsUnicos = new Set(configs.flatMap((c) => c.turmaIds))
    const turnosDasTurmas = turmas.filter((t) => turmaIdsUnicos.has(t.id)).map((t) => t.turno)
    return PERIODOS.filter((turno) => turnosDasTurmas.includes(turno))
  }

  const isIndisponivel = (p: Professor, dia: DiaSemana, horario: string) =>
    p.indisponibilidades.some((x) => x.dia === dia && x.horario === horario)

  const toggleIndisponivel = (p: Professor, dia: DiaSemana, horario: string) => {
    const next = isIndisponivel(p, dia, horario)
      ? p.indisponibilidades.filter((x) => !(x.dia === dia && x.horario === horario))
      : [...p.indisponibilidades, { dia, horario }]
    updateProfessor(p.id, { indisponibilidades: next })
  }

  const handleNovo = () => {
    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setProfessores([...professores, { id, nome: `Professor ${professores.length + 1}`, turmasPorDisciplina: {}, indisponibilidades: [] }])
    setSelectedId(id)
  }

  const handleRemover = (id: string) => {
    setProfessores(professores.filter((p) => p.id !== id))
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
    setProfessores(professores.filter((p) => !selecionadas.has(p.id)))
    if (selectedId && selecionadas.has(selectedId)) setSelectedId(null)
    sairDoModoSelecao()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Professores</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Nome, disciplinas e (opcionalmente) turmas de cada um — usados pelo gerador para alocar as aulas.
      </p>

      <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Lista */}
        <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${selecionado ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 p-2.5 dark:border-white/5">
            <button
              type="button"
              onClick={handleNovo}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Novo professor
            </button>
            <button
              type="button"
              onClick={() => (modoSelecao ? sairDoModoSelecao() : setModoSelecao(true))}
              aria-label={modoSelecao ? "Cancelar seleção" : "Selecionar vários"}
              title={modoSelecao ? "Cancelar seleção" : "Selecionar vários"}
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
                {confirmandoExclusao ? `Confirmar exclusão (${selecionadas.size})` : `Excluir selecionados (${selecionadas.size})`}
              </button>
            </div>
          )}

          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {professores.map((p) => {
              const marcada = selecionadas.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => (modoSelecao ? toggleSelecionada(p.id) : setSelectedId(p.id))}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    !modoSelecao && selectedId === p.id
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
                  <span className="flex-1 truncate">{p.nome || "Sem nome"}</span>
                  {!modoSelecao && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                </button>
              )
            })}
            {professores.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Nenhum professor cadastrado ainda.</p>
            )}
          </div>

          <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-white/5">
            {professores.length} {professores.length === 1 ? "professor cadastrado" : "professores cadastrados"}
          </p>
        </div>

        {/* Detalhe */}
        <div className={selecionado ? "" : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"}>
          {!selecionado && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              Selecione um professor à esquerda, ou clique em "Novo professor" pra cadastrar.
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
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Voltar pra lista
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  value={selecionado.nome}
                  onChange={(e) => updateProfessor(selecionado.id, { nome: e.target.value })}
                  placeholder="Nome do professor"
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-lg font-semibold text-slate-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:text-white dark:focus:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => handleRemover(selecionado.id)}
                  aria-label="Excluir professor"
                  title="Excluir professor"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalProfessorId(selecionado.id)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Disciplinas e turmas
                </span>
                <span className="text-xs text-slate-400">
                  {Object.keys(selecionado.turmasPorDisciplina).length === 0
                    ? "nenhuma disciplina"
                    : `${Object.keys(selecionado.turmasPorDisciplina).length} disciplina${Object.keys(selecionado.turmasPorDisciplina).length !== 1 ? "s" : ""}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateProfessor(selecionado.id, { concentrarDias: !selecionado.concentrarDias })}
                title="O gerador tenta encaixar as aulas desse professor nos dias em que ele já dá aula, pra sobrar algum dia livre. É só uma preferência — nunca bloqueia um dia à força."
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  selecionado.concentrarDias
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300"
                    : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4" />
                  Tentar concentrar aulas (liberar um dia)
                </span>
                <span
                  className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                    selecionado.concentrarDias ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      selecionado.concentrarDias ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Indisponibilidade
                  {selecionado.indisponibilidades.length > 0 && (
                    <span className="font-normal text-slate-400">
                      {" "}
                      ({selecionado.indisponibilidades.length} horário{selecionado.indisponibilidades.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </span>

                {(() => {
                  const turnos = turnosDoProfessor(selecionado)
                  if (turnos.length === 0) {
                    return (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Cadastre horários de aula em Configurações pra poder marcar indisponibilidade.
                      </p>
                    )
                  }
                  const turnoAtual = turnoSelecionado[selecionado.id] ?? turnos[0]
                  const horariosDoTurno = blocos
                    .filter((b) => b.turno === turnoAtual && b.tipo === "aula")
                    .sort((a, b) => a.inicio.localeCompare(b.inicio))

                  return (
                    <div className="mt-1.5">
                      {turnos.length > 1 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {turnos.map((turno) => (
                            <button
                              key={turno}
                              type="button"
                              onClick={() => setTurnoSelecionado((prev) => ({ ...prev, [selecionado.id]: turno }))}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                turnoAtual === turno
                                  ? "bg-brand-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                              }`}
                            >
                              {TURNO_LABEL[turno]}
                            </button>
                          ))}
                        </div>
                      )}
                      {horariosDoTurno.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Nenhum horário de aula configurado pro turno {TURNO_LABEL[turnoAtual].toLowerCase()}.
                        </p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                          <table className="w-full border-collapse text-center text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-white/5">
                                <th className="border-b border-slate-200 px-2 py-1.5 text-left font-medium text-slate-400 dark:border-white/10">
                                  Horário
                                </th>
                                {DIAS_SEMANA.map((dia) => (
                                  <th
                                    key={dia}
                                    className="border-b border-l border-slate-200 px-2 py-1.5 font-medium text-slate-400 dark:border-white/10"
                                  >
                                    {dia}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {horariosDoTurno.map((bloco) => (
                                <tr key={bloco.id}>
                                  <td className="whitespace-nowrap border-b border-slate-100 px-2 py-1 text-left text-slate-400 dark:border-white/5">
                                    {bloco.inicio}
                                  </td>
                                  {DIAS_SEMANA.map((dia) => {
                                    const bloqueado = isIndisponivel(selecionado, dia, bloco.inicio)
                                    return (
                                      <td
                                        key={dia}
                                        className="border-b border-l border-slate-100 p-0.5 dark:border-white/5"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleIndisponivel(selecionado, dia, bloco.inicio)}
                                          aria-label={`${bloqueado ? "Liberar" : "Marcar indisponível"} ${dia} ${bloco.inicio}`}
                                          className={`h-6 w-full rounded transition-colors ${
                                            bloqueado
                                              ? "bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/50"
                                              : "hover:bg-slate-100 dark:hover:bg-white/5"
                                          }`}
                                        />
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      <MateriasProfessorModal
        professor={professores.find((p) => p.id === modalProfessorId) ?? null}
        disciplinas={disciplinas}
        turmas={turmas}
        onClose={() => setModalProfessorId(null)}
        onChange={(next) => {
          if (modalProfessorId) updateProfessor(modalProfessorId, next)
        }}
      />
    </div>
  )
}
