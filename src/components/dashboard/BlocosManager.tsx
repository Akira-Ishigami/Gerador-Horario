import { useState } from "react"
import { Coffee, Plus, Trash2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { PERIODOS, type Periodo } from "@/data/mockData"

const TURNO_LABEL: Record<Periodo, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
}

export function BlocosManager() {
  const { blocos, setBlocos } = useData()
  const [turnoSelecionado, setTurnoSelecionado] = useState<Periodo>("matutino")
  const [novoInicio, setNovoInicio] = useState("")
  const [novoFim, setNovoFim] = useState("")

  const doTurno = blocos.filter((b) => b.turno === turnoSelecionado)
  const ordenados = [...doTurno].sort((a, b) => a.inicio.localeCompare(b.inicio))

  const handleAdd = () => {
    if (!novoInicio || !novoFim) return
    setBlocos([
      ...blocos,
      { id: `h-${Date.now()}`, inicio: novoInicio, fim: novoFim, tipo: "aula", turno: turnoSelecionado },
    ])
    setNovoInicio("")
    setNovoFim("")
  }

  const updateBloco = (id: string, changes: Partial<{ inicio: string; fim: string; tipo: "aula" | "intervalo" }>) => {
    setBlocos(blocos.map((b) => (b.id === id ? { ...b, ...changes } : b)))
  }

  const removeBloco = (id: string) => {
    setBlocos(blocos.filter((b) => b.id !== id))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Horários das aulas</h2>
      <p className="mb-4 text-xs text-slate-400">
        Defina o início e o fim de cada aula e marque o intervalo — o gerador nunca encaixa aula no intervalo. Cada
        turno tem seus próprios horários.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {PERIODOS.map((turno) => {
          const qtd = blocos.filter((b) => b.turno === turno).length
          return (
            <button
              key={turno}
              type="button"
              onClick={() => setTurnoSelecionado(turno)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                turnoSelecionado === turno
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {TURNO_LABEL[turno]}
              {qtd > 0 && <span className="ml-1.5 opacity-70">({qtd})</span>}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="time"
            value={novoInicio}
            onChange={(e) => setNovoInicio(e.target.value)}
            aria-label="Início"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <span className="text-sm text-slate-400">até</span>
          <input
            type="time"
            value={novoFim}
            onChange={(e) => setNovoFim(e.target.value)}
            aria-label="Fim"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!novoInicio || !novoFim}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Adicionar horário
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {ordenados.map((bloco) => (
          <div
            key={bloco.id}
            className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
              bloco.tipo === "intervalo"
                ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                : "border-slate-200 dark:border-white/10"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={bloco.inicio}
                onChange={(e) => updateBloco(bloco.id, { inicio: e.target.value })}
                aria-label="Início"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="time"
                value={bloco.fim}
                onChange={(e) => updateBloco(bloco.id, { fim: e.target.value })}
                aria-label="Fim"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
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
            Nenhum horário ainda para o turno {TURNO_LABEL[turnoSelecionado].toLowerCase()} — adicione o primeiro
            acima.
          </p>
        )}
      </div>
    </div>
  )
}
