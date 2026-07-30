import { DIAS_SEMANA, type BlocoHorario, type Disciplina, type Professor, type Turma } from "@/data/mockData"

export interface SlotAssignment {
  disciplinaId: string
  professorId: string
}

/** grade[dia][blocoIndex] — blocoIndex corresponde à posição em `blocos` (inclui intervalos, sempre null neles) */
export type Grade = (SlotAssignment | null)[][]

export interface GeneratedSchedule {
  grades: Record<string, Grade>
  conflitos: string[]
}

const emptyGrade = (totalBlocos: number): Grade =>
  DIAS_SEMANA.map(() => Array.from({ length: totalBlocos }, () => null))

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
 * seja escalado em duas turmas no mesmo dia/horário. Estratégia gulosa com
 * preferência por espalhar as aulas de uma disciplina ao longo da semana;
 * quando não há slot válido, registra o conflito em vez de travar a geração.
 * Blocos do tipo "intervalo" nunca recebem aula.
 *
 * Cada turma só usa os blocos do próprio turno (`blocos.turno`) — turnos
 * diferentes podem ter horários totalmente distintos (ex: matutino 07h-12h,
 * noturno 19h-22h30). A ocupação do professor é rastreada pelo horário de
 * início real (não pelo índice do bloco), pra pegar conflito mesmo entre
 * turnos que se sobrepõem no relógio (ex: um professor em turma integral e
 * outra matutina ao mesmo tempo).
 */
export function gerarHorarios(
  turmas: Turma[],
  professores: Professor[],
  blocos: BlocoHorario[],
  disciplinas: Disciplina[],
): GeneratedSchedule {
  const grades: Record<string, Grade> = {}
  const conflitos: string[] = []
  // ocupacao[professorId] = Set("diaIndex-horaInicio")
  const ocupacaoProfessor = new Map<string, Set<string>>()

  const nomeDisciplina = (disciplinaId: string) =>
    disciplinas.find((d) => d.id === disciplinaId)?.nome ?? disciplinaId

  const blocosPorTurma = new Map<string, BlocoHorario[]>()
  for (const turma of turmas) {
    const blocosTurno = blocos.filter((b) => b.turno === turma.turno)
    blocosPorTurma.set(turma.id, blocosTurno)
    grades[turma.id] = emptyGrade(blocosTurno.length)
  }

  // turmaIds vazio = professor aceita qualquer turma que precise da disciplina
  const professorPorDisciplina = (disciplinaId: string, turmaId: string): Professor[] =>
    professores.filter(
      (p) => p.disciplinaIds.includes(disciplinaId) && (p.turmaIds.length === 0 || p.turmaIds.includes(turmaId)),
    )

  for (const turma of turmas) {
    const grade = grades[turma.id]
    const blocosAula = (blocosPorTurma.get(turma.id) ?? [])
      .map((b, index) => ({ ...b, index }))
      .filter((b) => b.tipo === "aula")

    const necessidades = Object.entries(turma.cargaHoraria)
      .filter(([, qtd]) => qtd > 0)
      .sort((a, b) => b[1] - a[1])

    for (const [disciplinaId, quantidade] of necessidades) {
      const candidatosProfessor = professorPorDisciplina(disciplinaId, turma.id)
      if (candidatosProfessor.length === 0) {
        conflitos.push(
          `Nenhum professor cadastrado para a disciplina "${nomeDisciplina(disciplinaId)}" (${turma.nome}).`,
        )
        continue
      }

      if (blocosAula.length === 0) {
        conflitos.push(
          `${turma.nome}: nenhum horário de aula configurado para o turno "${turma.turno}" — configure em Configurações.`,
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
          const ordemBlocos = shuffle(blocosAula)
          for (const bloco of ordemBlocos) {
            if (grade[diaIdx][bloco.index] !== null) continue
            const key = `${diaIdx}-${bloco.inicio}`
            const professorLivre = shuffle(candidatosProfessor).find(
              (p) => !ocupacaoProfessor.get(p.id)?.has(key),
            )
            if (!professorLivre) continue

            grade[diaIdx][bloco.index] = {
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
          `${turma.nome}: só foi possível alocar ${colocadas}/${quantidade} aulas de "${nomeDisciplina(disciplinaId)}" — grade cheia ou professor indisponível.`,
        )
      }
    }
  }

  return { grades, conflitos }
}
