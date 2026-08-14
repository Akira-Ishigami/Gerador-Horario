import { DIAS_SEMANA, type BlocoHorario, type Professor, type Turma } from "@/data/mockData"
import type { GeneratedSchedule } from "@/lib/scheduleGenerator"

export interface CelulaProfessor {
  turmaNome: string
  disciplinaId: string
  fim: string
}

/**
 * célula[`${dia}-${horaInicio}`] = o que o professor dá naquele horário
 * real, juntando turmas de turnos diferentes — convenção turno-agnóstica de
 * horário (mesma usada em `ocupacaoProfessor` no scheduleGenerator.ts).
 * Usado por Exportar (.xlsx), Relatórios (tela) e Exportar (.docx) — um só
 * lugar pra essa lógica em vez de reimplementar em cada exportador.
 */
export function celulasDoProfessor(
  professor: Professor,
  turmas: Turma[],
  schedule: GeneratedSchedule,
  blocos: BlocoHorario[],
): Map<string, CelulaProfessor> {
  const celulas = new Map<string, CelulaProfessor>()
  for (const turma of turmas) {
    const grade = schedule.grades[turma.id]
    if (!grade) continue
    const blocosDaTurma = blocos.filter((b) => b.turno === turma.turno)
    grade.forEach((linha, diaIdx) => {
      linha.forEach((assignment, blocoIdx) => {
        if (!assignment || assignment.professorId !== professor.id) return
        const bloco = blocosDaTurma[blocoIdx]
        if (!bloco) return
        celulas.set(`${DIAS_SEMANA[diaIdx]}-${bloco.inicio}`, {
          turmaNome: turma.nome,
          disciplinaId: assignment.disciplinaId,
          fim: bloco.fim,
        })
      })
    })
  }
  return celulas
}

/** turno com mais aulas atribuídas a esse professor na grade — usado como molde de horário (linhas/intervalo) quando ele dá aula em mais de um turno. */
export function turnoPrincipalDoProfessor(professor: Professor, turmas: Turma[], schedule: GeneratedSchedule): Turma["turno"] | null {
  const contagem = new Map<Turma["turno"], number>()
  for (const turma of turmas) {
    const grade = schedule.grades[turma.id]
    if (!grade) continue
    let n = 0
    grade.forEach((linha) => linha.forEach((slot) => { if (slot?.professorId === professor.id) n++ }))
    if (n > 0) contagem.set(turma.turno, (contagem.get(turma.turno) ?? 0) + n)
  }
  if (contagem.size === 0) return null
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0]
}
