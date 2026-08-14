import { useState } from "react"
import { Printer, Sparkles } from "lucide-react"
import { useData } from "@/context/DataContext"
import { DIAS_SEMANA, type Disciplina } from "@/data/mockData"
import type { GeneratedSchedule } from "@/lib/scheduleGenerator"
import { celulasDoProfessor, type CelulaProfessor } from "@/lib/professorSchedule"
import { ScheduleGrid } from "@/components/ScheduleGrid"

type Modo = "turmas" | "professores"
type Escopo = "individual" | "geral"

interface RelatoriosManagerProps {
  schedule: GeneratedSchedule | null
  modo: Modo
  escopo: Escopo
}

function TabelaProfessor({ celulas, disciplinaMap }: { celulas: Map<string, CelulaProfessor>; disciplinaMap: Map<string, Disciplina> }) {
  if (celulas.size === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Sem aula na grade gerada.</p>
  }
  const horarios = Array.from(new Set([...celulas.keys()].map((k) => k.split("-").slice(1).join("-")))).sort()

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5">
            <th className="w-28 border-b border-slate-200 px-2 py-2 text-xs font-semibold text-slate-400 dark:border-white/10">Horário</th>
            {DIAS_SEMANA.map((dia) => (
              <th key={dia} className="border-b border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300">
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horarios.map((horario) => {
            const fim = DIAS_SEMANA.map((dia) => celulas.get(`${dia}-${horario}`)?.fim).find(Boolean)
            return (
              <tr key={horario} className="dark:even:bg-white/2">
                <td className="whitespace-nowrap border-b border-slate-100 px-2 py-2 text-xs font-medium text-slate-400 dark:border-white/10">
                  {horario}{fim ? `–${fim}` : ""}
                </td>
                {DIAS_SEMANA.map((dia) => {
                  const cel = celulas.get(`${dia}-${horario}`)
                  const disciplina = cel ? disciplinaMap.get(cel.disciplinaId) : null
                  return (
                    <td key={dia} className="border-b border-l border-slate-100 p-1 align-top dark:border-white/10">
                      {cel && disciplina ? (
                        <div
                          className="rounded-lg px-2 py-1.5 text-xs"
                          style={{ backgroundColor: `${disciplina.cor}1a`, borderLeft: `3px solid ${disciplina.cor}` }}
                        >
                          <p className="font-semibold text-slate-700 dark:text-slate-100">{disciplina.nome}</p>
                          <p className="text-slate-400">{cel.turmaNome}</p>
                        </div>
                      ) : (
                        <div className="h-8 rounded-lg border border-dashed border-slate-100 dark:border-white/10" />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** "Relatórios" (Turmas/Professores × Individual/Geral, ver menu em Controles). Visualização em tela + impressão, separado do "Exportar" (que baixa .xlsx). */
export function RelatoriosManager({ schedule, modo, escopo }: RelatoriosManagerProps) {
  const { turmas, professores, disciplinas, blocos } = useData()
  const [turmaId, setTurmaId] = useState<string | null>(turmas[0]?.id ?? null)
  const [professorId, setProfessorId] = useState<string | null>(professores[0]?.id ?? null)

  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))

  if (!schedule) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
        <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
        Gere um horário primeiro na aba "Horário" pra ver os relatórios.
      </div>
    )
  }

  const turmaSelecionada = turmas.find((t) => t.id === turmaId) ?? null
  const professorSelecionado = professores.find((p) => p.id === professorId) ?? null
  const titulo = `${modo === "turmas" ? "Turmas" : "Professores"} — ${escopo === "individual" ? "Individual" : "Geral"}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-base font-semibold text-slate-800 dark:text-white">{titulo}</h2>
          {escopo === "individual" && modo === "turmas" && (
            <select
              value={turmaId ?? ""}
              onChange={(e) => setTurmaId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          )}
          {escopo === "individual" && modo === "professores" && (
            <select
              value={professorId ?? ""}
              onChange={(e) => setProfessorId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimir
        </button>
      </div>

      {modo === "turmas" && escopo === "individual" && (
        <>
          {turmas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Cadastre uma turma primeiro.</p>
          ) : turmaSelecionada ? (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">{turmaSelecionada.nome}</h3>
              <ScheduleGrid grade={schedule.grades[turmaSelecionada.id] ?? null} blocos={blocos.filter((b) => b.turno === turmaSelecionada.turno)} />
            </div>
          ) : null}
        </>
      )}

      {modo === "turmas" && escopo === "geral" && (
        <div className="space-y-6">
          {turmas.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Cadastre uma turma primeiro.</p>
          )}
          {turmas.map((turma) => (
            <div key={turma.id} className="break-inside-avoid">
              <h3 className="mb-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">{turma.nome}</h3>
              <ScheduleGrid grade={schedule.grades[turma.id] ?? null} blocos={blocos.filter((b) => b.turno === turma.turno)} compact />
            </div>
          ))}
        </div>
      )}

      {modo === "professores" && escopo === "individual" && (
        <>
          {professores.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Cadastre um professor primeiro.</p>
          ) : professorSelecionado ? (
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">{professorSelecionado.nome}</h3>
              <TabelaProfessor celulas={celulasDoProfessor(professorSelecionado, turmas, schedule, blocos)} disciplinaMap={disciplinaMap} />
            </div>
          ) : null}
        </>
      )}

      {modo === "professores" && escopo === "geral" && (
        <div className="space-y-6">
          {professores.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">Cadastre um professor primeiro.</p>
          )}
          {professores.map((professor) => {
            const celulas = celulasDoProfessor(professor, turmas, schedule, blocos)
            if (celulas.size === 0) return null
            return (
              <div key={professor.id} className="break-inside-avoid">
                <h3 className="mb-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">{professor.nome}</h3>
                <TabelaProfessor celulas={celulas} disciplinaMap={disciplinaMap} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
