import { useState } from "react"
import { Ban, RotateCcw } from "lucide-react"
import { useData } from "@/context/DataContext"
import { PERIODOS, type Disciplina, type Periodo } from "@/data/mockData"

const TURNO_LABEL: Record<Periodo, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
  integral: "Integral",
}

const horariosUnicos = (turno?: Periodo) => (blocos: { turno: Periodo; tipo: string; inicio: string }[]) =>
  Array.from(new Set(blocos.filter((b) => b.tipo === "aula" && (!turno || b.turno === turno)).map((b) => b.inicio))).sort()

/**
 * "Limitar Horários" (Controles → Disciplinas): restringe uma disciplina a
 * só poder cair em certos horários do dia (ex: Educação Física nunca no
 * último horário). Convenção turno-agnóstica (mesmo horário pode existir em
 * vários turnos) — ver `Disciplina.horariosPermitidos` e `cabeNoHorario`
 * em scheduleGenerator.ts.
 */
export function LimitarHorariosManager() {
  const { disciplinas, setDisciplinas, blocos } = useData()
  const [disciplinaId, setDisciplinaId] = useState<string | null>(null)

  const disciplina = disciplinas.find((d) => d.id === disciplinaId) ?? null
  const todosOsHorarios = horariosUnicos()(blocos)

  const permitido = (d: Disciplina, horario: string) =>
    !d.horariosPermitidos || d.horariosPermitidos.length === 0 || d.horariosPermitidos.includes(horario)

  const toggle = (d: Disciplina, horario: string) => {
    const base = d.horariosPermitidos && d.horariosPermitidos.length > 0 ? d.horariosPermitidos : todosOsHorarios
    const next = base.includes(horario) ? base.filter((h) => h !== horario) : [...base, horario]
    const semRestricao = todosOsHorarios.length > 0 && todosOsHorarios.every((h) => next.includes(h))
    setDisciplinas(disciplinas.map((x) => (x.id === d.id ? { ...x, horariosPermitidos: semRestricao ? [] : next } : x)))
  }

  const limparRestricao = (d: Disciplina) => {
    setDisciplinas(disciplinas.map((x) => (x.id === d.id ? { ...x, horariosPermitidos: [] } : x)))
  }

  const restrita = (d: Disciplina) => (d.horariosPermitidos?.length ?? 0) > 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">Limitar horários</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Escolha uma disciplina e desmarque os horários em que ela NÃO pode cair (ex: Educação Física nunca no último
        horário). Sem nada desmarcado, qualquer horário vale.
      </p>

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Lista de disciplinas */}
        <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${disciplina ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <div className="max-h-112 flex-1 overflow-y-auto p-1.5">
            {disciplinas.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDisciplinaId(d.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  disciplinaId === d.id
                    ? "bg-brand-600 font-medium text-white shadow-sm shadow-brand-600/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
                <span className="flex-1 truncate">{d.nome}</span>
                {restrita(d) && (
                  <Ban className={`h-3.5 w-3.5 shrink-0 ${disciplinaId === d.id ? "text-white/80" : "text-amber-500"}`} />
                )}
              </button>
            ))}
            {disciplinas.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-slate-400">Cadastre disciplinas primeiro.</p>
            )}
          </div>
        </div>

        {/* Detalhe */}
        <div
          className={
            disciplina
              ? ""
              : "hidden items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 dark:border-slate-700 md:flex"
          }
        >
          {!disciplina && (
            <p className="max-w-[16rem] text-center text-sm text-slate-400">
              Selecione uma disciplina à esquerda pra restringir os horários em que ela pode ter aula.
            </p>
          )}

          {disciplina && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold text-slate-800 dark:text-white">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: disciplina.cor }} />
                  {disciplina.nome}
                </h3>
                {restrita(disciplina) && (
                  <button
                    type="button"
                    onClick={() => limparRestricao(disciplina)}
                    className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-brand-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Permitir todos
                  </button>
                )}
              </div>

              {todosOsHorarios.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400 dark:bg-white/5">
                  Cadastre horários de aula em Configurações primeiro.
                </p>
              ) : (
                PERIODOS.map((turno) => {
                  const horariosDoTurno = horariosUnicos(turno)(blocos)
                  if (horariosDoTurno.length === 0) return null
                  return (
                    <div key={turno}>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{TURNO_LABEL[turno]}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {horariosDoTurno.map((h) => {
                          const ok = permitido(disciplina, h)
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => toggle(disciplina, h)}
                              title={ok ? "Clique pra proibir esse horário" : "Clique pra permitir de novo"}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                ok
                                  ? "border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:text-slate-300"
                                  : "border-rose-200 bg-rose-50 text-rose-600 line-through dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400"
                              }`}
                            >
                              {h}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
