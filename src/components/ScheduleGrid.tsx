import { useState } from "react"
import { GripVertical } from "lucide-react"
import { DIAS_SEMANA, HORARIOS } from "@/data/mockData"
import type { Grade } from "@/lib/scheduleGenerator"
import { useTheme } from "@/context/ThemeContext"
import { useData } from "@/context/DataContext"

interface ScheduleGridProps {
  grade: Grade | null
  compact?: boolean
  onMove?: (fromDia: number, fromPeriodo: number, toDia: number, toPeriodo: number) => void
}

export function ScheduleGrid({ grade, compact = false, onMove }: ScheduleGridProps) {
  const { theme } = useTheme()
  const { professores, disciplinas } = useData()
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))
  const professorMap = new Map(professores.map((p) => [p.id, p]))
  // no escuro a cor de fundo precisa de mais opacidade pra não sumir contra o card escuro
  const chipAlpha = theme === "dark" ? "40" : "1a"

  const [dragFrom, setDragFrom] = useState<{ dia: number; periodo: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dia: number; periodo: number } | null>(null)

  const podeArrastar = Boolean(onMove) && !compact

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 dark:bg-white/5">
            <th className="w-20 border-b border-slate-200 px-2 py-2 text-xs font-semibold text-slate-400 dark:border-white/10">
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
          {HORARIOS.map((hora, periodoIdx) => (
            <tr key={hora} className="dark:even:bg-white/2">
              <td className="border-b border-slate-100 px-2 py-2 text-xs font-medium text-slate-400 dark:border-white/10">
                {hora}
              </td>
              {DIAS_SEMANA.map((dia, diaIdx) => {
                const assignment = grade?.[diaIdx]?.[periodoIdx] ?? null
                const disciplina = assignment ? disciplinaMap.get(assignment.disciplinaId) : null
                const professor = assignment ? professorMap.get(assignment.professorId) : null
                const isDragOver = dragOver?.dia === diaIdx && dragOver?.periodo === periodoIdx
                const isDragSource = dragFrom?.dia === diaIdx && dragFrom?.periodo === periodoIdx

                return (
                  <td
                    key={dia}
                    onDragOver={
                      podeArrastar
                        ? (e) => {
                            e.preventDefault()
                            if (!isDragOver) setDragOver({ dia: diaIdx, periodo: periodoIdx })
                          }
                        : undefined
                    }
                    onDragLeave={
                      podeArrastar
                        ? () => setDragOver((prev) => (prev?.dia === diaIdx && prev?.periodo === periodoIdx ? null : prev))
                        : undefined
                    }
                    onDrop={
                      podeArrastar
                        ? (e) => {
                            e.preventDefault()
                            setDragOver(null)
                            const raw = e.dataTransfer.getData("text/plain")
                            if (!raw) return
                            const from = JSON.parse(raw) as { dia: number; periodo: number }
                            if (from.dia === diaIdx && from.periodo === periodoIdx) return
                            onMove?.(from.dia, from.periodo, diaIdx, periodoIdx)
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
                                e.dataTransfer.setData("text/plain", JSON.stringify({ dia: diaIdx, periodo: periodoIdx }))
                                e.dataTransfer.effectAllowed = "move"
                                setDragFrom({ dia: diaIdx, periodo: periodoIdx })
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
