import { useState } from "react"
import { Coffee, Plus, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"

export function BlocosManager() {
  const { blocos, setBlocos } = useData()
  const [novoHorario, setNovoHorario] = useState("")

  const ordenados = [...blocos].sort((a, b) => a.horario.localeCompare(b.horario))

  const handleAdd = () => {
    if (!novoHorario) return
    if (blocos.some((b) => b.horario === novoHorario)) return
    setBlocos([...blocos, { id: `h-${Date.now()}`, horario: novoHorario, tipo: "aula" }])
    setNovoHorario("")
  }

  const updateBloco = (id: string, changes: Partial<{ horario: string; tipo: "aula" | "intervalo" }>) => {
    setBlocos(blocos.map((b) => (b.id === id ? { ...b, ...changes } : b)))
  }

  const removeBloco = (id: string) => {
    setBlocos(blocos.filter((b) => b.id !== id))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Horários das aulas</h2>
      <p className="mb-4 text-xs text-slate-400">
        Defina o horário de início de cada aula e marque o intervalo — o gerador nunca encaixa aula no intervalo.
      </p>

      <div className="flex gap-2">
        <input
          type="time"
          value={novoHorario}
          onChange={(e) => setNovoHorario(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!novoHorario}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Adicionar horário
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {ordenados.map((bloco) => (
          <div
            key={bloco.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              bloco.tipo === "intervalo"
                ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                : "border-slate-200 dark:border-white/10"
            }`}
          >
            <input
              type="time"
              value={bloco.horario}
              onChange={(e) => updateBloco(bloco.id, { horario: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="button"
              onClick={() => updateBloco(bloco.id, { tipo: bloco.tipo === "aula" ? "intervalo" : "aula" })}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                bloco.tipo === "intervalo"
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <Coffee className="h-3.5 w-3.5" />
              {bloco.tipo === "intervalo" ? "Intervalo" : "Aula"}
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => removeBloco(bloco.id)}
              aria-label="Remover horário"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {ordenados.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhum horário ainda — adicione o primeiro acima.
          </p>
        )}
      </div>
    </div>
  )
}
