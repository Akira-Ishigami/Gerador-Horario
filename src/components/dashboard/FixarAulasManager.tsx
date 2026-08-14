import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Pin, Search, Sparkles } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA, type AulaFixa, type DiaSemana } from "@/data/mockData"

interface Linha {
  disciplinaId: string
  disciplinaNome: string
  turmaId: string
  turmaNome: string
  aulas: number
}

const chave = (disciplinaId: string, turmaId: string) => `${disciplinaId}::${turmaId}`

/**
 * "Fixar Aulas" (Controles → Professores, ver print do Urânia): prende uma
 * aula de um professor num dia/horário específico de uma turma — o gerador
 * coloca essas primeiro e nunca move (ver `gerarHorarios` em
 * scheduleGenerator.ts). Mesmo fluxo professor-primeiro de "Tipos
 * específicos", só que em vez de escolher um Tipo, marca células numa
 * grade dia×horário.
 */
export function FixarAulasManager() {
  const { professores, turmas, disciplinas, blocos, updateTurma } = useData()
  const [professorId, setProfessorId] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [linhaAberta, setLinhaAberta] = useState<string | null>(null)

  const professor = professores.find((p) => p.id === professorId) ?? null
  const professoresFiltrados = professores.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase()))

  const linhas: Linha[] = useMemo(() => {
    if (!professor) return []
    const out: Linha[] = []
    for (const [disciplinaId, config] of Object.entries(professor.turmasPorDisciplina)) {
      const disciplina = disciplinas.find((d) => d.id === disciplinaId)
      const turmasAlvo = config.turmaIds.length === 0 ? turmas : turmas.filter((t) => config.turmaIds.includes(t.id))
      for (const turma of turmasAlvo) {
        const aulas = turma.cargaHoraria[disciplinaId] ?? 0
        if (aulas <= 0) continue
        out.push({ disciplinaId, disciplinaNome: disciplina?.nome ?? disciplinaId, turmaId: turma.id, turmaNome: turma.nome, aulas })
      }
    }
    return out.sort((a, b) => a.disciplinaNome.localeCompare(b.disciplinaNome) || a.turmaNome.localeCompare(b.turmaNome))
  }, [professor, turmas, disciplinas])

  const selecionarProfessor = (id: string) => {
    setProfessorId(id)
    setLinhaAberta(null)
  }

  const contarFixas = (l: Linha, turmaFixas: AulaFixa[]) =>
    turmaFixas.filter((af) => af.disciplinaId === l.disciplinaId && af.professorId === professor?.id).length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Fixar aulas</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Escolha um professor e marque na grade os horários em que uma aula dele fica presa naquele dia/horário — o
        gerador nunca move nem sobrescreve uma aula fixa.
      </p>

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Lista de professores */}
        <div
          className={`rounded-xl border border-slate-200 dark:border-white/10 ${
            professor ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          {professores.length > 6 && (
            <div className="border-b border-slate-100 p-2.5 dark:border-white/5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar professor..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          )}
          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {professoresFiltrados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selecionarProfessor(p.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  professorId === p.id
                    ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex-1 truncate">{p.nome || "Sem nome"}</span>
              </button>
            ))}
            {professores.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Cadastre professores primeiro.</p>
            )}
            {professores.length > 0 && professoresFiltrados.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Nenhum professor bate com "{busca}".</p>
            )}
          </div>
        </div>

        {/* Detalhe */}
        <div
          className={
            professor
              ? ""
              : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"
          }
        >
          {!professor && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              Selecione um professor à esquerda pra ver as turmas em que ele dá aula e fixar horários.
            </p>
          )}

          {professor && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setProfessorId(null)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Voltar pra lista de professores
                </button>
              </div>

              <h3 className="font-display text-base font-semibold text-slate-800 dark:text-white">{professor.nome}</h3>

              {linhas.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-400 dark:border-slate-700">
                  <Sparkles className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                  Esse professor ainda não tem disciplina com carga horária definida em nenhuma turma.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
                  {linhas.map((l) => {
                    const key = chave(l.disciplinaId, l.turmaId)
                    const turma = turmas.find((t) => t.id === l.turmaId)!
                    const totalFixas = contarFixas(l, turma.aulasFixas)
                    const aberta = linhaAberta === key
                    const horarios = blocos
                      .filter((b) => b.turno === turma.turno && b.tipo === "aula")
                      .sort((a, b) => a.inicio.localeCompare(b.inicio))
                    const dias = DIAS_SEMANA.filter((d) => turma.diasFuncionamento.includes(d))

                    const isFixa = (dia: DiaSemana, horario: string) =>
                      turma.aulasFixas.some(
                        (af) => af.dia === dia && af.horario === horario && af.disciplinaId === l.disciplinaId && af.professorId === professor.id,
                      )
                    const ocupadaPorOutra = (dia: DiaSemana, horario: string) =>
                      turma.aulasFixas.some(
                        (af) => af.dia === dia && af.horario === horario && !(af.disciplinaId === l.disciplinaId && af.professorId === professor.id),
                      )
                    const toggle = (dia: DiaSemana, horario: string) => {
                      if (ocupadaPorOutra(dia, horario)) return
                      const existe = isFixa(dia, horario)
                      const next: AulaFixa[] = existe
                        ? turma.aulasFixas.filter(
                            (af) => !(af.dia === dia && af.horario === horario && af.disciplinaId === l.disciplinaId && af.professorId === professor.id),
                          )
                        : [...turma.aulasFixas, { disciplinaId: l.disciplinaId, professorId: professor.id, dia, horario }]
                      updateTurma(turma.id, { aulasFixas: next })
                    }

                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setLinhaAberta(aberta ? null : key)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <span className="flex-1 truncate">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{l.turmaNome}</span>
                            <span className="text-slate-400"> · {l.disciplinaNome}</span>
                          </span>
                          {totalFixas > 0 && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                              <Pin className="h-3 w-3" /> {totalFixas}
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberta ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence initial={false}>
                          {aberta && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.16, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3">
                                {horarios.length === 0 || dias.length === 0 ? (
                                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-white/5">
                                    Cadastre horários de aula (Configurações) e dias de funcionamento (Turmas) pra essa turma.
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
                                    <table className="w-full border-collapse text-center text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                          <th className="border-b border-slate-200 px-2 py-1.5 text-left font-medium text-slate-400 dark:border-white/10">
                                            Horário
                                          </th>
                                          {dias.map((dia) => (
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
                                        {horarios.map((bloco) => (
                                          <tr key={bloco.id}>
                                            <td className="whitespace-nowrap border-b border-slate-100 px-2 py-1 text-left text-slate-400 dark:border-white/5">
                                              {bloco.inicio}
                                            </td>
                                            {dias.map((dia) => {
                                              const fixa = isFixa(dia, bloco.inicio)
                                              const bloqueada = !fixa && ocupadaPorOutra(dia, bloco.inicio)
                                              return (
                                                <td key={dia} className="border-b border-l border-slate-100 p-0.5 dark:border-white/5">
                                                  <button
                                                    type="button"
                                                    onClick={() => toggle(dia, bloco.inicio)}
                                                    disabled={bloqueada}
                                                    title={bloqueada ? "Já tem outra aula fixa nesse horário" : undefined}
                                                    aria-label={`${fixa ? "Soltar" : "Fixar"} ${dia} ${bloco.inicio}`}
                                                    className={`flex h-6 w-full items-center justify-center rounded transition-colors ${
                                                      fixa
                                                        ? "bg-brand-600 text-white hover:bg-brand-700"
                                                        : bloqueada
                                                          ? "cursor-not-allowed bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600"
                                                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                                                    }`}
                                                  >
                                                    {fixa && <Pin className="h-3 w-3" />}
                                                  </button>
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
