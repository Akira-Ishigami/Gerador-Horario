import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA, PERIODOS, type DiaSemana, type Periodo, type Professor } from "@/data/mockData"

const TURNO_LABEL: Record<Periodo, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
}

const pillClasse = (ativa: boolean) =>
  `rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
    ativa
      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
  }`

export function ProfessoresManager() {
  const { professores, setProfessores, disciplinas, turmas, blocos } = useData()
  const [novoNome, setNovoNome] = useState("")
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const [turnoSelecionado, setTurnoSelecionado] = useState<Record<string, Periodo>>({})

  const updateProfessor = (index: number, next: Professor) => {
    setProfessores(professores.map((p, i) => (i === index ? next : p)))
  }

  /** turnos em que o professor pode efetivamente dar aula — todos os configurados se alguma disciplina não tiver restrição de turma, senão o turno das turmas que aparecem em qualquer disciplina dele */
  const turnosDoProfessor = (p: Professor): Periodo[] => {
    const listas = Object.values(p.turmasPorDisciplina)
    const semRestricao = listas.length === 0 || listas.some((ids) => ids.length === 0)
    if (semRestricao) {
      return PERIODOS.filter((turno) => blocos.some((b) => b.turno === turno && b.tipo === "aula"))
    }
    const turmaIdsUnicos = new Set(listas.flat())
    const turnosDasTurmas = turmas.filter((t) => turmaIdsUnicos.has(t.id)).map((t) => t.turno)
    return PERIODOS.filter((turno) => turnosDasTurmas.includes(turno))
  }

  const isIndisponivel = (p: Professor, dia: DiaSemana, horario: string) =>
    p.indisponibilidades.some((x) => x.dia === dia && x.horario === horario)

  const toggleIndisponivel = (index: number, p: Professor, dia: DiaSemana, horario: string) => {
    const next = isIndisponivel(p, dia, horario)
      ? p.indisponibilidades.filter((x) => !(x.dia === dia && x.horario === horario))
      : [...p.indisponibilidades, { dia, horario }]
    updateProfessor(index, { ...p, indisponibilidades: next })
  }

  const removeProfessor = (index: number) => {
    setProfessores(professores.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const nome = novoNome.trim()
    if (!nome) return
    setProfessores([...professores, { id: `p-${Date.now()}`, nome, turmasPorDisciplina: {}, indisponibilidades: [] }])
    setNovoNome("")
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Professores</h2>
      <p className="mb-4 text-xs text-slate-400">
        Nome, matérias e (opcionalmente) turmas de cada um — usados pelo gerador para alocar as aulas.
      </p>

      <div className="flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Nome do novo professor"
          className="w-full min-w-0 max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {professores.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={p.nome}
                onChange={(e) => updateProfessor(i, { ...p, nome: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeProfessor(i)}
                aria-label="Remover professor"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Matérias e turmas
              </p>
              <div className="space-y-1 rounded-xl border border-slate-100 p-1 dark:border-white/5">
                {disciplinas.map((d) => {
                  const ativa = d.id in p.turmasPorDisciplina
                  const turmasDaDisciplina = p.turmasPorDisciplina[d.id] ?? []
                  const todasAsTurmas = turmasDaDisciplina.length === 0
                  return (
                    <div key={d.id} className="overflow-hidden rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...p.turmasPorDisciplina }
                          if (ativa) delete next[d.id]
                          else next[d.id] = []
                          updateProfessor(i, { ...p, turmasPorDisciplina: next })
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        <span
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                          style={{
                            borderColor: ativa ? d.cor : undefined,
                            backgroundColor: ativa ? d.cor : "transparent",
                          }}
                        >
                          {ativa && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-sm font-medium transition-colors ${
                            ativa ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {d.nome}
                        </span>
                        {ativa && !todasAsTurmas && (
                          <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                            {turmasDaDisciplina.length} turma{turmasDaDisciplina.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {ativa && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeInOut" }}
                          >
                            <div className="flex flex-wrap gap-1.5 py-1.5 pl-8 pr-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateProfessor(i, {
                                    ...p,
                                    turmasPorDisciplina: { ...p.turmasPorDisciplina, [d.id]: [] },
                                  })
                                }
                                className={pillClasse(todasAsTurmas)}
                              >
                                Todas as turmas
                              </button>
                              {turmas.map((t) => {
                                const restrita = turmasDaDisciplina.includes(t.id)
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      const proximasTurmas = restrita
                                        ? turmasDaDisciplina.filter((id) => id !== t.id)
                                        : [...turmasDaDisciplina, t.id]
                                      updateProfessor(i, {
                                        ...p,
                                        turmasPorDisciplina: { ...p.turmasPorDisciplina, [d.id]: proximasTurmas },
                                      })
                                    }}
                                    className={pillClasse(restrita)}
                                  >
                                    {t.nome}
                                  </button>
                                )
                              })}
                              {turmas.length === 0 && (
                                <span className="text-[11px] text-slate-400">Cadastre turmas primeiro.</span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
                {disciplinas.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-slate-400">Cadastre matérias primeiro para poder atribuí-las.</p>
                )}
              </div>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setExpandidoId(expandidoId === p.id ? null : p.id)}
                className="flex w-full items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {expandidoId === p.id ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Indisponibilidade
                {p.indisponibilidades.length > 0 && (
                  <span className="normal-case font-normal text-slate-400">
                    ({p.indisponibilidades.length} horário{p.indisponibilidades.length !== 1 ? "s" : ""})
                  </span>
                )}
              </button>

              {expandidoId === p.id &&
                (() => {
                  const turnos = turnosDoProfessor(p)
                  if (turnos.length === 0) {
                    return (
                      <p className="mt-2 text-xs text-slate-400">
                        Cadastre horários de aula em Configurações pra poder marcar indisponibilidade.
                      </p>
                    )
                  }
                  const turnoAtual = turnoSelecionado[p.id] ?? turnos[0]
                  const horariosDoTurno = blocos
                    .filter((b) => b.turno === turnoAtual && b.tipo === "aula")
                    .sort((a, b) => a.inicio.localeCompare(b.inicio))

                  return (
                    <div className="mt-2">
                      {turnos.length > 1 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {turnos.map((turno) => (
                            <button
                              key={turno}
                              type="button"
                              onClick={() => setTurnoSelecionado((prev) => ({ ...prev, [p.id]: turno }))}
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
                                    const bloqueado = isIndisponivel(p, dia, bloco.inicio)
                                    return (
                                      <td
                                        key={dia}
                                        className="border-b border-l border-slate-100 p-0.5 dark:border-white/5"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleIndisponivel(i, p, dia, bloco.inicio)}
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
        ))}
        {professores.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhum professor ainda — adicione o primeiro acima.
          </p>
        )}
      </div>
    </div>
  )
}
