import { useMemo, useState } from "react"
import { Check, ListFilter, Search, Sparkles } from "lucide-react"
import { useData } from "@/context/DataContext"
import { TIPOS_AULA, tipoEfetivo, type TipoAula } from "@/data/mockData"
import { TipoGlyph } from "@/components/dashboard/MateriasProfessorModal"

interface Linha {
  disciplinaId: string
  disciplinaNome: string
  turmaId: string
  turmaNome: string
  aulas: number
  tipo: TipoAula
}

const chave = (disciplinaId: string, turmaId: string) => `${disciplinaId}::${turmaId}`

/**
 * Tela "Definir Tipos Específicos" (inspirada no Urânia, ver Controles):
 * escolhe um professor, lista turma+disciplina que ele dá aula com o Tipo
 * atual de cada, e aplica um novo Tipo só nas turmas marcadas — sobrepõe o
 * padrão da disciplina (editado no modal "Disciplinas e turmas") sem mudar
 * as outras turmas dela.
 */
export function TiposEspecificosManager() {
  const { professores, setProfessores, turmas, disciplinas } = useData()
  const [professorId, setProfessorId] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [aplicadoTipo, setAplicadoTipo] = useState<TipoAula | null>(null)

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
        out.push({
          disciplinaId,
          disciplinaNome: disciplina?.nome ?? disciplinaId,
          turmaId: turma.id,
          turmaNome: turma.nome,
          aulas,
          tipo: tipoEfetivo(config, turma.id),
        })
      }
    }
    return out.sort((a, b) => a.disciplinaNome.localeCompare(b.disciplinaNome) || a.turmaNome.localeCompare(b.turmaNome))
  }, [professor, turmas, disciplinas])

  const selecionarProfessor = (id: string) => {
    setProfessorId(id)
    setSelecionadas(new Set())
    setAplicadoTipo(null)
  }

  const toggleLinha = (key: string) => {
    setAplicadoTipo(null)
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const todasMarcadas = linhas.length > 0 && linhas.every((l) => selecionadas.has(chave(l.disciplinaId, l.turmaId)))
  const toggleTodas = () => {
    setAplicadoTipo(null)
    setSelecionadas(todasMarcadas ? new Set() : new Set(linhas.map((l) => chave(l.disciplinaId, l.turmaId))))
  }

  const aplicarTipo = (novoTipo: TipoAula) => {
    if (!professor || selecionadas.size === 0) return
    const next = { ...professor.turmasPorDisciplina }
    for (const key of selecionadas) {
      const [disciplinaId, turmaId] = key.split("::")
      const atual = next[disciplinaId]
      if (!atual) continue
      next[disciplinaId] = { ...atual, tipoPorTurma: { ...atual.tipoPorTurma, [turmaId]: novoTipo } }
    }
    setProfessores(professores.map((p) => (p.id === professor.id ? { ...p, turmasPorDisciplina: next } : p)))
    setAplicadoTipo(novoTipo)
    setSelecionadas(new Set())
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Tipos específicos</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Escolha um professor e ajuste o Tipo (encadeamento das aulas) turma por turma, sobrepondo o padrão da disciplina —
        útil quando o mesmo professor precisa de um Tipo diferente pra turmas diferentes na mesma matéria.
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
              Selecione um professor à esquerda pra ver as turmas em que ele dá aula e ajustar o Tipo de cada uma.
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
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                          <th className="w-8 border-b border-slate-200 px-2 py-2 dark:border-white/10">
                            <button
                              type="button"
                              onClick={toggleTodas}
                              aria-label={todasMarcadas ? "Desmarcar todas" : "Marcar todas"}
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                todasMarcadas
                                  ? "border-brand-600 bg-brand-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {todasMarcadas && <Check className="h-3 w-3" />}
                            </button>
                          </th>
                          <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-medium text-slate-400 dark:border-white/10">
                            Turma
                          </th>
                          <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-medium text-slate-400 dark:border-white/10">
                            Disciplina
                          </th>
                          <th className="border-b border-slate-200 px-2 py-2 text-left text-xs font-medium text-slate-400 dark:border-white/10">
                            Tipo atual
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((l) => {
                          const key = chave(l.disciplinaId, l.turmaId)
                          const marcada = selecionadas.has(key)
                          return (
                            <tr
                              key={key}
                              onClick={() => toggleLinha(key)}
                              className={`cursor-pointer transition-colors ${
                                marcada ? "bg-brand-50 dark:bg-brand-950/40" : "hover:bg-slate-50 dark:hover:bg-white/5"
                              }`}
                            >
                              <td className="border-b border-slate-100 px-2 py-2 dark:border-white/5">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    marcada
                                      ? "border-brand-600 bg-brand-600 text-white"
                                      : "border-slate-300 dark:border-slate-600"
                                  }`}
                                >
                                  {marcada && <Check className="h-3 w-3" />}
                                </span>
                              </td>
                              <td className="border-b border-slate-100 px-2 py-2 text-slate-700 dark:border-white/5 dark:text-slate-200">
                                {l.turmaNome}
                              </td>
                              <td className="border-b border-slate-100 px-2 py-2 text-slate-500 dark:border-white/5 dark:text-slate-400">
                                {l.disciplinaNome} <span className="text-slate-400">· {l.aulas} aula{l.aulas !== 1 ? "s" : ""}</span>
                              </td>
                              <td className="border-b border-slate-100 px-2 py-2 dark:border-white/5">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <span className="text-xs font-bold">{l.tipo}</span>
                                  <TipoGlyph tipo={l.tipo} />
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <ListFilter className="h-3.5 w-3.5" />
                        Novo Tipo pras {selecionadas.size} turma{selecionadas.size !== 1 ? "s" : ""} selecionada
                        {selecionadas.size !== 1 ? "s" : ""}
                      </span>
                      {aplicadoTipo && (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Aplicado: {aplicadoTipo}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TIPOS_AULA.map((opcao) => (
                        <button
                          key={opcao.valor}
                          type="button"
                          title={opcao.descricao}
                          disabled={selecionadas.size === 0}
                          onClick={() => aplicarTipo(opcao.valor)}
                          className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
                        >
                          <span className="text-[11px] font-bold leading-none">{opcao.valor}</span>
                          <TipoGlyph tipo={opcao.valor} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
