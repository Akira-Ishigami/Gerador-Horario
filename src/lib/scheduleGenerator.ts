import { DIAS_SEMANA, HORARIOS, type Professor, type Turma } from "@/data/mockData"

export interface SlotAssignment {
  disciplinaId: string
  professorId: string
}

/** grade[dia][periodo] */
export type Grade = (SlotAssignment | null)[][]

export interface GeneratedSchedule {
  grades: Record<string, Grade>
  conflitos: string[]
}

const emptyGrade = (): Grade =>
  DIAS_SEMANA.map(() => HORARIOS.map(() => null))

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Gera a grade horária de todas as turmas evitando que um mesmo professor
 * seja escalado em duas turmas no mesmo dia/período. Estratégia gulosa com
 * preferência por espalhar as aulas de uma disciplina ao longo da semana;
 * quando não há slot válido, registra o conflito em vez de travar a geração.
 */
export function gerarHorarios(
  turmas: Turma[],
  professores: Professor[],
): GeneratedSchedule {
  const grades: Record<string, Grade> = {}
  const conflitos: string[] = []
  // ocupacao[professorId] = Set("diaIndex-periodoIndex")
  const ocupacaoProfessor = new Map<string, Set<string>>()

  for (const turma of turmas) {
    grades[turma.id] = emptyGrade()
  }

  const professorPorDisciplina = (disciplinaId: string): Professor[] =>
    professores.filter((p) => p.disciplinaIds.includes(disciplinaId))

  for (const turma of turmas) {
    const grade = grades[turma.id]
    const necessidades = Object.entries(turma.cargaHoraria)
      .filter(([, qtd]) => qtd > 0)
      .sort((a, b) => b[1] - a[1])

    for (const [disciplinaId, quantidade] of necessidades) {
      const candidatosProfessor = professorPorDisciplina(disciplinaId)
      if (candidatosProfessor.length === 0) {
        conflitos.push(
          `Nenhum professor cadastrado para a disciplina "${disciplinaId}" (${turma.nome}).`,
        )
        continue
      }

      const usosPorDia = DIAS_SEMANA.map(() => 0)
      let colocadas = 0

      for (let tentativa = 0; tentativa < quantidade; tentativa++) {
        const ordemDias = shuffle(DIAS_SEMANA.map((_, i) => i)).sort(
          (a, b) => usosPorDia[a] - usosPorDia[b],
        )

        let posicionado = false
        for (const diaIdx of ordemDias) {
          if (posicionado) break
          const ordemPeriodos = shuffle(HORARIOS.map((_, i) => i))
          for (const periodoIdx of ordemPeriodos) {
            if (grade[diaIdx][periodoIdx] !== null) continue
            const key = `${diaIdx}-${periodoIdx}`
            const professorLivre = shuffle(candidatosProfessor).find(
              (p) => !ocupacaoProfessor.get(p.id)?.has(key),
            )
            if (!professorLivre) continue

            grade[diaIdx][periodoIdx] = {
              disciplinaId,
              professorId: professorLivre.id,
            }
            if (!ocupacaoProfessor.has(professorLivre.id)) {
              ocupacaoProfessor.set(professorLivre.id, new Set())
            }
            ocupacaoProfessor.get(professorLivre.id)!.add(key)
            usosPorDia[diaIdx]++
            colocadas++
            posicionado = true
            break
          }
        }
      }

      if (colocadas < quantidade) {
        conflitos.push(
          `${turma.nome}: só foi possível alocar ${colocadas}/${quantidade} aulas de "${disciplinaId}" — grade cheia ou professor indisponível.`,
        )
      }
    }
  }

  return { grades, conflitos }
}
