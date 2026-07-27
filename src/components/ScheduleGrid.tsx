import { DIAS_SEMANA, DISCIPLINAS, HORARIOS, PROFESSORES } from "@/data/mockData"
import type { Grade } from "@/lib/scheduleGenerator"

interface ScheduleGridProps {
  grade: Grade | null
  compact?: boolean
}

export function ScheduleGrid({ grade, compact = false }: ScheduleGridProps) {
  const disciplinaMap = new Map(DISCIPLINAS.map((d) => [d.id, d]))
  const professorMap = new Map(PROFESSORES.map((p) => [p.id, p]))

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
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
            <tr key={hora}>
              <td className="border-b border-slate-100 px-2 py-2 text-xs font-medium text-slate-400 dark:border-white/5">
                {hora}
              </td>
              {DIAS_SEMANA.map((dia, diaIdx) => {
                const assignment = grade?.[diaIdx]?.[periodoIdx] ?? null
                const disciplina = assignment ? disciplinaMap.get(assignment.disciplinaId) : null
                const professor = assignment ? professorMap.get(assignment.professorId) : null
                return (
                  <td key={dia} className="border-b border-l border-slate-100 p-1 align-top dark:border-white/5">
                    {disciplina ? (
                      <div
                        className={`rounded-lg px-2 py-1.5 ${compact ? "text-[10px]" : "text-xs"}`}
                        style={{
                          backgroundColor: `${disciplina.cor}1a`,
                          borderLeft: `3px solid ${disciplina.cor}`,
                        }}
                      >
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{disciplina.nome}</p>
                        {!compact && professor && (
                          <p className="text-slate-400 dark:text-slate-500">{professor.nome}</p>
                        )}
                      </div>
                    ) : (
                      <div className="h-8 rounded-lg border border-dashed border-slate-100 dark:border-white/5" />
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
