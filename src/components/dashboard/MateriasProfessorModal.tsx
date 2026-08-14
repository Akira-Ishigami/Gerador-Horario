import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, HelpCircle, Search, X } from "lucide-react"
import { TIPOS_AULA, type Disciplina, type Professor, type TipoAula, type Turma } from "@/data/mockData"

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

/**
 * Cada tipo é uma forma diferente de encadear aulas na semana — em vez de só
 * a letra crua (A/G/H/K/L/N), um mini-diagrama de bolinhas mostra isso de
 * cara: sozinha, ligada com traço pontilhado (tenta geminar, pode separar)
 * ou traço sólido (sempre geminada).
 */
type Token = "dot" | "dot-tentativa" | "elo" | "elo-tenta" | "vao"

const PADRAO_TIPO: Record<TipoAula, Token[]> = {
  A: ["dot"],
  G: ["dot", "elo-tenta", "dot"],
  H: ["dot", "elo", "dot"],
  K: ["dot", "elo", "dot", "vao", "dot"],
  L: ["dot", "elo", "dot", "vao", "dot-tentativa"],
  N: ["dot", "elo", "dot", "vao", "dot", "elo", "dot"],
}

export function TipoGlyph({ tipo }: { tipo: TipoAula }) {
  return (
    <span className="flex items-center gap-px">
      {PADRAO_TIPO[tipo].map((token, i) => {
        if (token === "dot") return <span key={i} className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
        if (token === "dot-tentativa") return <span key={i} className="h-1.5 w-1.5 shrink-0 rounded-full border border-dashed border-current" />
        if (token === "elo") return <span key={i} className="h-px w-2 shrink-0 bg-current" />
        if (token === "elo-tenta") return <span key={i} className="h-0 w-2 shrink-0 border-t border-dashed border-current" />
        return <span key={i} className="w-1 shrink-0" />
      })}
    </span>
  )
}

export function MateriasProfessorModal({ professor, disciplinas, turmas, onClose, onChange }: MateriasProfessorModalProps) {
  const [busca, setBusca] = useState("")
  const [legendaAberta, setLegendaAberta] = useState(false)
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
        setLegendaAberta(false)
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
                  Disciplinas e turmas
                </h3>
                <p className="text-xs text-slate-400">
                  {professor.nome} · {totalAtivas} disciplina{totalAtivas !== 1 ? "s" : ""}
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
                    placeholder="Buscar disciplina..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-1.5">
              {disciplinasFiltradas.map((d) => {
                const config = professor.turmasPorDisciplina[d.id]
                const ativa = config !== undefined
                const turmasDaDisciplina = config?.turmaIds ?? []
                const tipoAtual = config?.tipo ?? "A"
                const todasAsTurmas = turmasDaDisciplina.length === 0
                const turmasComTipoProprio = Object.keys(config?.tipoPorTurma ?? {}).length
                return (
                  <div key={d.id} className="border-b border-slate-50 py-0.5 last:border-0 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...professor.turmasPorDisciplina }
                        if (ativa) delete next[d.id]
                        else next[d.id] = { turmaIds: [], tipo: "A" }
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
                        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400">
                          <TipoGlyph tipo={tipoAtual} />
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
                                  turmasPorDisciplina: {
                                    ...professor.turmasPorDisciplina,
                                    [d.id]: { turmaIds: [], tipo: tipoAtual },
                                  },
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
                                      turmasPorDisciplina: {
                                        ...professor.turmasPorDisciplina,
                                        [d.id]: { turmaIds: proximasTurmas, tipo: tipoAtual },
                                      },
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

                          <div className="pl-10 pr-2">
                            <div className="flex items-center gap-1.5 pb-1">
                              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                Tipo
                              </span>
                              <button
                                type="button"
                                onClick={() => setLegendaAberta((v) => !v)}
                                aria-label="O que significa cada tipo?"
                                title="O que significa cada tipo?"
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                                  legendaAberta
                                    ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                                    : "text-slate-300 hover:text-brand-600 dark:text-slate-600 dark:hover:text-brand-400"
                                }`}
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-0 flex-1 truncate text-right text-[11px] text-slate-400">
                                {TIPOS_AULA.find((o) => o.valor === tipoAtual)?.label}
                              </span>
                            </div>

                            {turmasComTipoProprio > 0 && (
                              <p className="pb-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                                {turmasComTipoProprio} turma{turmasComTipoProprio !== 1 ? "s" : ""} com Tipo próprio (definido
                                em Controles → Tipos específicos) — mudar o padrão aqui não afeta elas.
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1.5 pb-1.5">
                              {TIPOS_AULA.map((opcao) => (
                                <button
                                  key={opcao.valor}
                                  type="button"
                                  title={opcao.descricao}
                                  onClick={() =>
                                    onChange({
                                      ...professor,
                                      turmasPorDisciplina: {
                                        ...professor.turmasPorDisciplina,
                                        [d.id]: { turmaIds: turmasDaDisciplina, tipo: opcao.valor },
                                      },
                                    })
                                  }
                                  className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-1.5 transition-colors ${
                                    tipoAtual === opcao.valor
                                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                                      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <span className="text-[11px] font-bold leading-none">{opcao.valor}</span>
                                  <TipoGlyph tipo={opcao.valor} />
                                </button>
                              ))}
                            </div>

                            <AnimatePresence initial={false}>
                              {legendaAberta && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.16, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="mb-1.5 grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/3">
                                    {TIPOS_AULA.map((opcao) => (
                                      <div key={opcao.valor} className="flex items-start gap-2.5">
                                        <span className="flex h-5 w-8 shrink-0 items-center justify-center gap-1 rounded-md border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
                                          <span className="text-[10px] font-bold leading-none">{opcao.valor}</span>
                                          <TipoGlyph tipo={opcao.valor} />
                                        </span>
                                        <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                                          <span className="font-semibold text-slate-800 dark:text-slate-200">{opcao.label}.</span>{" "}
                                          {opcao.descricao}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              {disciplinasFiltradas.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-slate-400">
                  {disciplinas.length === 0 ? "Cadastre disciplinas primeiro." : `Nenhuma disciplina bate com "${busca}".`}
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
