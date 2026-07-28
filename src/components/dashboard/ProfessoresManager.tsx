import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import type { Professor } from "@/data/mockData"

interface ProfessoresManagerProps {
  /** turmas (e disciplina) que cada professor leciona na última grade gerada — chave é o professorId */
  turmasPorProfessor?: Map<string, { turma: string; disciplina: string }[]>
}

export function ProfessoresManager({ turmasPorProfessor }: ProfessoresManagerProps) {
  const { professores, setProfessores, disciplinas } = useData()
  const [novoNome, setNovoNome] = useState("")

  const updateProfessor = (index: number, next: Professor) => {
    setProfessores(professores.map((p, i) => (i === index ? next : p)))
  }

  const removeProfessor = (index: number) => {
    setProfessores(professores.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const nome = novoNome.trim()
    if (!nome) return
    setProfessores([...professores, { id: `p-${Date.now()}`, nome, disciplinaIds: [] }])
    setNovoNome("")
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Professores</h2>
      <p className="mb-4 text-xs text-slate-400">
        Nome e matérias que cada um leciona — usados pelo gerador para alocar as aulas.
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
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            <div className="mt-3 flex flex-wrap gap-1.5">
              {disciplinas.map((d) => {
                const active = p.disciplinaIds.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      const next = active ? p.disciplinaIds.filter((id) => id !== d.id) : [...p.disciplinaIds, d.id]
                      updateProfessor(i, { ...p, disciplinaIds: next })
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
              {disciplinas.length === 0 && (
                <p className="text-xs text-slate-400">Cadastre matérias primeiro para poder atribuí-las.</p>
              )}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Turmas que leciona</p>
              {turmasPorProfessor?.get(p.id)?.length ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {turmasPorProfessor.get(p.id)!.map((t) => (
                    <li
                      key={`${t.turma}-${t.disciplina}`}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300"
                    >
                      {t.turma} <span className="text-slate-400">· {t.disciplina}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  {turmasPorProfessor ? "Não escalado na última grade gerada." : "Gere os horários para ver as turmas."}
                </p>
              )}
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
