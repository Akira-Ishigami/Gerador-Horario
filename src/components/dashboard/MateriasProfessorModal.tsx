import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Search, X } from "lucide-react"
import type { Disciplina, Professor, Turma } from "@/data/mockData"

interface MateriasProfessorModalProps {
  professor: Professor | null
  disciplinas: Disciplina[]
  turmas: Turma[]
  onClose: () => void
  onChange: (next: Professor) => void
}

const pillClasse = (ativa: boolean) =>
  `rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
    ativa
      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
  }`

export function MateriasProfessorModal({ professor, disciplinas, turmas, onClose, onChange }: MateriasProfessorModalProps) {
  const [busca, setBusca] = useState("")
  const aberto = professor !== null

  // trava o scroll da página atrás enquanto o modal está aberto — sem isso,
  // rolar a lista até o fim "vaza" o gesto pra página por trás dele
  useEffect(() => {
    if (!aberto) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [aberto])

  const disciplinasFiltradas = disciplinas.filter((d) => d.nome.toLowerCase().includes(busca.trim().toLowerCase()))
  const totalAtivas = professor ? Object.keys(professor.turmasPorDisciplina).length : 0

  return (
    <AnimatePresence
      onExitComplete={() => {
        setBusca("")
      }}
    >
      {professor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-white/10">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Matérias e turmas
                </h3>
                <p className="text-xs text-slate-400">
                  {professor.nome} · {totalAtivas} matéria{totalAtivas !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {disciplinas.length > 6 && (
              <div className="border-b border-slate-100 px-4 py-2.5 dark:border-white/10">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar matéria..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-1.5">
              {disciplinasFiltradas.map((d) => {
                const ativa = d.id in professor.turmasPorDisciplina
                const turmasDaDisciplina = professor.turmasPorDisciplina[d.id] ?? []
                const todasAsTurmas = turmasDaDisciplina.length === 0
                return (
                  <div key={d.id} className="border-b border-slate-50 py-0.5 last:border-0 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...professor.turmasPorDisciplina }
                        if (ativa) delete next[d.id]
                        else next[d.id] = []
                        onChange({ ...professor, turmasPorDisciplina: next })
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                        style={{
                          borderColor: ativa ? d.cor : undefined,
                          backgroundColor: ativa ? d.cor : "transparent",
                        }}
                      >
                        {ativa && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          ativa ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {d.nome}
                      </span>
                      {ativa && (
                        <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                          {todasAsTurmas ? "todas as turmas" : `${turmasDaDisciplina.length} turma${turmasDaDisciplina.length !== 1 ? "s" : ""}`}
                        </span>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {ativa && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16, ease: "easeInOut" }}
                        >
                          <div className="flex flex-wrap gap-1.5 py-1.5 pl-10 pr-2">
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...professor,
                                  turmasPorDisciplina: { ...professor.turmasPorDisciplina, [d.id]: [] },
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
                                    onChange({
                                      ...professor,
                                      turmasPorDisciplina: { ...professor.turmasPorDisciplina, [d.id]: proximasTurmas },
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
              {disciplinasFiltradas.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  {disciplinas.length === 0 ? "Cadastre matérias primeiro." : `Nenhuma matéria bate com "${busca}".`}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-3 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Concluído
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
