import { useState } from "react"
import { GripVertical } from "lucide-react"
import { DIAS_SEMANA, type BlocoHorario } from "@/data/mockData"
import type { Grade } from "@/lib/scheduleGenerator"
import { useData } from "@/context/DataContext"

interface ScheduleGridProps {
  grade: Grade | null
  blocos: BlocoHorario[]
  compact?: boolean
  onMove?: (fromDia: number, fromBloco: number, toDia: number, toBloco: number) => void
}

export function ScheduleGrid({ grade, blocos, compact = false, onMove }: ScheduleGridProps) {
  const { professores, disciplinas } = useData()
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))
  const professorMap = new Map(professores.map((p) => [p.id, p]))
  const chipAlpha = "1a"

  const [dragFrom, setDragFrom] = useState<{ dia: number; bloco: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dia: number; bloco: number } | null>(null)

  const podeArrastar = Boolean(onMove) && !compact

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5">
            <th className="w-28 border-b border-slate-200 px-2 py-2 text-xs font-semibold text-slate-400 dark:border-white/10">
              Horário
            </th>
            {DIAS_SEMANA.map((dia) => (
              <th
                key={dia}
                className="border-b border-l border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-300"
              >
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocos.map((bloco, blocoIdx) =>
            bloco.tipo === "intervalo" ? (
              <tr key={bloco.id} className="bg-amber-50/60 dark:bg-amber-950/20">
                <td className="whitespace-nowrap border-b border-slate-100 px-2 py-1.5 text-xs font-medium text-amber-700 dark:border-white/10 dark:text-amber-400">
                  {bloco.inicio}–{bloco.fim}
                </td>
                <td
                  colSpan={DIAS_SEMANA.length}
                  className="border-b border-l border-slate-100 px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:border-white/10 dark:text-amber-400"
                >
                  Intervalo
                </td>
              </tr>
            ) : (
              <tr key={bloco.id} className="dark:even:bg-white/2">
                <td className="whitespace-nowrap border-b border-slate-100 px-2 py-2 text-xs font-medium text-slate-400 dark:border-white/10">
                  {bloco.inicio}–{bloco.fim}
                </td>
                {DIAS_SEMANA.map((dia, diaIdx) => {
                  const assignment = grade?.[diaIdx]?.[blocoIdx] ?? null
                  const disciplina = assignment ? disciplinaMap.get(assignment.disciplinaId) : null
                  const professor = assignment ? professorMap.get(assignment.professorId) : null
                  const isDragOver = dragOver?.dia === diaIdx && dragOver?.bloco === blocoIdx
                  const isDragSource = dragFrom?.dia === diaIdx && dragFrom?.bloco === blocoIdx

                  return (
                    <td
                      key={dia}
                      onDragOver={
                        podeArrastar
                          ? (e) => {
                              e.preventDefault()
                              if (!isDragOver) setDragOver({ dia: diaIdx, bloco: blocoIdx })
                            }
                          : undefined
                      }
                      onDragLeave={
                        podeArrastar
                          ? () => setDragOver((prev) => (prev?.dia === diaIdx && prev?.bloco === blocoIdx ? null : prev))
                          : undefined
                      }
                      onDrop={
                        podeArrastar
                          ? (e) => {
                              e.preventDefault()
                              setDragOver(null)
                              const raw = e.dataTransfer.getData("text/plain")
                              if (!raw) return
                              const from = JSON.parse(raw) as { dia: number; bloco: number }
                              if (from.dia === diaIdx && from.bloco === blocoIdx) return
                              onMove?.(from.dia, from.bloco, diaIdx, blocoIdx)
                            }
                          : undefined
                      }
                      className={`border-b border-l border-slate-100 p-1 align-top transition-colors dark:border-white/10 ${
                        isDragOver ? "bg-brand-50 dark:bg-brand-950/40" : ""
                      }`}
                    >
                      {disciplina ? (
                        <div
                          draggable={podeArrastar}
                          onDragStart={
                            podeArrastar
                              ? (e) => {
                                  e.dataTransfer.setData("text/plain", JSON.stringify({ dia: diaIdx, bloco: blocoIdx }))
                                  e.dataTransfer.effectAllowed = "move"
                                  setDragFrom({ dia: diaIdx, bloco: blocoIdx })
                                }
                              : undefined
                          }
                          onDragEnd={podeArrastar ? () => setDragFrom(null) : undefined}
                          className={`group flex items-start gap-1 rounded-lg px-2 py-1.5 transition-opacity ${
                            compact ? "text-[10px]" : "text-xs"
                          } ${podeArrastar ? "cursor-grab active:cursor-grabbing" : ""} ${isDragSource ? "opacity-30" : "opacity-100"}`}
                          style={{
                            backgroundColor: `${disciplina.cor}${chipAlpha}`,
                            borderLeft: `3px solid ${disciplina.cor}`,
                          }}
                        >
                          {podeArrastar && (
                            <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-100">{disciplina.nome}</p>
                            {!compact && professor && (
                              <p className="text-slate-400 dark:text-slate-400">{professor.nome}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`h-8 rounded-lg border border-dashed dark:border-white/10 ${
                            isDragOver ? "border-brand-400" : "border-slate-100"
                          }`}
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}
