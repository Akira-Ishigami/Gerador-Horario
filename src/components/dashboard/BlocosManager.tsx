import { useState } from "react"
import { Coffee, Plus, Trash2, Wand2 } from "lucide-react"
import { useData } from "@/context/DataContext"
import { PERIODOS, type BlocoHorario, type Periodo } from "@/data/mockData"

const TURNO_LABEL: Record<Periodo, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
}

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function paraHorario(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24
  const m = minutos % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

interface IntervaloConfig {
  depoisDaAula: number
  duracao: number
}

export function BlocosManager() {
  const { blocos, setBlocos } = useData()
  const [turnoSelecionado, setTurnoSelecionado] = useState<Periodo>("matutino")
  const [novoInicio, setNovoInicio] = useState("")
  const [novoFim, setNovoFim] = useState("")

  // Gerador automático: em vez de digitar cada horário na mão, descreve a
  // grade por posição ("intervalo depois da 3ª aula") — mais perto de como
  // escola pensa a grade — e a gente calcula os horários reais a partir daí.
  const [horaInicio, setHoraInicio] = useState("07:00")
  const [duracaoAula, setDuracaoAula] = useState(45)
  const [qtdAulas, setQtdAulas] = useState(6)
  const [intervalos, setIntervalos] = useState<IntervaloConfig[]>([{ depoisDaAula: 3, duracao: 20 }])

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

  const addIntervaloConfig = () => {
    setIntervalos([...intervalos, { depoisDaAula: Math.max(1, qtdAulas - 1), duracao: 20 }])
  }

  const updateIntervaloConfig = (index: number, changes: Partial<IntervaloConfig>) => {
    setIntervalos(intervalos.map((it, i) => (i === index ? { ...it, ...changes } : it)))
  }

  const removeIntervaloConfig = (index: number) => {
    setIntervalos(intervalos.filter((_, i) => i !== index))
  }

  const gerarAutomaticamente = () => {
    let cursor = paraMinutos(horaInicio)
    const gerados: BlocoHorario[] = []
    for (let aula = 1; aula <= qtdAulas; aula++) {
      const inicio = paraHorario(cursor)
      cursor += duracaoAula
      gerados.push({ id: `h-${Date.now()}-${aula}a`, inicio, fim: paraHorario(cursor), tipo: "aula", turno: turnoSelecionado })

      const intervalo = intervalos.find((it) => it.depoisDaAula === aula && aula < qtdAulas)
      if (intervalo && intervalo.duracao > 0) {
        const inicioIntervalo = paraHorario(cursor)
        cursor += intervalo.duracao
        gerados.push({
          id: `h-${Date.now()}-${aula}i`,
          inicio: inicioIntervalo,
          fim: paraHorario(cursor),
          tipo: "intervalo",
          turno: turnoSelecionado,
        })
      }
    }
    setBlocos([...blocos.filter((b) => b.turno !== turnoSelecionado), ...gerados])
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

      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Wand2 className="h-4 w-4 text-brand-600" /> Gerar horários automaticamente
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Início da 1ª aula</span>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Duração da aula (min)</span>
            <input
              type="number"
              min={1}
              value={duracaoAula}
              onChange={(e) => setDuracaoAula(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Quantidade de aulas</span>
            <input
              type="number"
              min={1}
              value={qtdAulas}
              onChange={(e) => setQtdAulas(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Intervalos (depois de qual aula)</span>
          <div className="mt-1 space-y-1.5">
            {intervalos.map((it, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Depois da</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, qtdAulas - 1)}
                  value={it.depoisDaAula}
                  onChange={(e) => updateIntervaloConfig(i, { depoisDaAula: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">ª aula, dura</span>
                <input
                  type="number"
                  min={1}
                  value={it.duracao}
                  onChange={(e) => updateIntervaloConfig(i, { duracao: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
                <button
                  type="button"
                  onClick={() => removeIntervaloConfig(i)}
                  aria-label="Remover intervalo"
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIntervaloConfig}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar intervalo
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={gerarAutomaticamente}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <Wand2 className="h-4 w-4" /> Gerar pro turno {TURNO_LABEL[turnoSelecionado].toLowerCase()}
        </button>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Substitui os horários já cadastrados pro turno {TURNO_LABEL[turnoSelecionado].toLowerCase()}.
        </p>
      </div>

      <p className="mb-1 mt-5 text-xs font-medium text-slate-500 dark:text-slate-400">Ou monte um horário por vez:</p>
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
