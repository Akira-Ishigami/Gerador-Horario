import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
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
  const [novaMateria, setNovaMateria] = useState("")

  const handleAdd = () => {
    const nome = novaMateria.trim()
    if (!nome) return
    setDisciplinas([
      ...disciplinas,
      { id: `d-${Date.now()}`, nome, cor: PALETA_CORES[disciplinas.length % PALETA_CORES.length] },
    ])
    setNovaMateria("")
  }

  const handleRemove = (id: string) => {
    setDisciplinas(disciplinas.filter((d) => d.id !== id))
  }

  const emUso = (id: string) => turmas.some((t) => (t.cargaHoraria[id] ?? 0) > 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Matérias</h2>
      <p className="mb-4 text-xs text-slate-400">
        A lista usada pelo gerador e pela carga horária de cada turma. Adicione quantas precisar.
      </p>

      <div className="flex gap-2">
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
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {disciplinas.map((d) => (
          <div
            key={d.id}
            className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5"
            style={{ borderLeft: `3px solid ${d.cor}` }}
          >
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.nome}</p>
              {emUso(d.id) && <p className="text-[11px] text-slate-400">usada em alguma turma</p>}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(d.id)}
              aria-label={`Remover ${d.nome}`}
              className="text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {disciplinas.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  )
}
