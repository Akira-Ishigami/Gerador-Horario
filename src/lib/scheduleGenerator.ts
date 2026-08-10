import { DIAS_SEMANA, PERIODOS, type BlocoHorario, type Disciplina, type Periodo, type Professor, type Turma } from "@/data/mockData"

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

type BlocoIndexado = BlocoHorario & { index: number }
interface ParConsecutivo {
  a: BlocoIndexado
  b: BlocoIndexado
}
interface Necessidade {
  turma: Turma
  disciplinaId: string
  quantidade: number
  candidatos: Professor[]
  geminada: boolean
}
interface SlotEncontrado {
  dia: number
  bloco: BlocoIndexado
  professor: Professor
}
interface ParEncontrado {
  dia: number
  a: BlocoIndexado
  b: BlocoIndexado
  professor: Professor
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
 * Pares de blocos "aula" consecutivos (mesmo dia, sem intervalo entre eles) —
 * calculado a partir da lista BRUTA do turno (com intervalos incluídos), não
 * da lista já filtrada só de aulas. Filtrar primeiro quebraria a adjacência
 * real: ex. no matutino, a lista filtrada vira [h1,h2,h3,h5,h6] e h3→h5
 * pareceriam consecutivos, mas têm o intervalo h4 (09:30-09:50) no meio.
 */
function paresConsecutivos(blocosTurno: BlocoHorario[]): ParConsecutivo[] {
  const pares: ParConsecutivo[] = []
  for (let i = 0; i < blocosTurno.length - 1; i++) {
    const a = blocosTurno[i]
    const b = blocosTurno[i + 1]
    if (a.tipo === "aula" && b.tipo === "aula" && a.fim === b.inicio) {
      pares.push({ a: { ...a, index: i }, b: { ...b, index: i + 1 } })
    }
  }
  return pares
}

/**
 * Enumera TODOS os (dia,bloco) onde o slot está livre e pelo menos um
 * professor candidato está livre, e devolve o melhor (menor uso do dia pra
 * essa disciplina até agora) — em vez de desistir depois de algumas
 * tentativas aleatórias como antes. A ordem de dias/blocos/professores é
 * embaralhada a cada chamada só pra dar variedade entre gerações
 * (clicar "Gerar horários" de novo ainda produz um resultado diferente),
 * mas a busca em si é exaustiva: nunca falha se existir uma opção válida.
 */
function buscarSlotExaustivo(
  blocosAula: BlocoIndexado[],
  candidatos: Professor[],
  ocupacaoProfessor: Map<string, Set<string>>,
  usosPorDia: number[],
  grade: Grade,
): SlotEncontrado | null {
  const candidatosEmbaralhados = shuffle(candidatos)
  const blocosEmbaralhados = shuffle(blocosAula)
  const opcoes: SlotEncontrado[] = []

  for (const diaIdx of shuffle(DIAS_SEMANA.map((_, i) => i))) {
    for (const bloco of blocosEmbaralhados) {
      if (grade[diaIdx][bloco.index] !== null) continue
      const key = `${diaIdx}-${bloco.inicio}`
      const professor = candidatosEmbaralhados.find((p) => !ocupacaoProfessor.get(p.id)?.has(key))
      if (professor) opcoes.push({ dia: diaIdx, bloco, professor })
    }
  }

  if (opcoes.length === 0) return null
  opcoes.sort((a, b) => usosPorDia[a.dia] - usosPorDia[b.dia])
  return opcoes[0]
}

/** Mesma ideia de `buscarSlotExaustivo`, mas pra um par geminado — precisa do mesmo professor livre nos dois horários. */
function buscarParExaustivo(
  pares: ParConsecutivo[],
  candidatos: Professor[],
  ocupacaoProfessor: Map<string, Set<string>>,
  usosPorDia: number[],
  grade: Grade,
): ParEncontrado | null {
  const candidatosEmbaralhados = shuffle(candidatos)
  const paresEmbaralhados = shuffle(pares)
  const opcoes: ParEncontrado[] = []

  for (const diaIdx of shuffle(DIAS_SEMANA.map((_, i) => i))) {
    for (const par of paresEmbaralhados) {
      if (grade[diaIdx][par.a.index] !== null || grade[diaIdx][par.b.index] !== null) continue
      const keyA = `${diaIdx}-${par.a.inicio}`
      const keyB = `${diaIdx}-${par.b.inicio}`
      const professor = candidatosEmbaralhados.find(
        (p) => !ocupacaoProfessor.get(p.id)?.has(keyA) && !ocupacaoProfessor.get(p.id)?.has(keyB),
      )
      if (professor) opcoes.push({ dia: diaIdx, a: par.a, b: par.b, professor })
    }
  }

  if (opcoes.length === 0) return null
  opcoes.sort((a, b) => usosPorDia[a.dia] - usosPorDia[b.dia])
  return opcoes[0]
}

/**
 * Gera a grade horária de todas as turmas evitando que um mesmo professor
 * seja escalado em duas turmas no mesmo dia/horário, respeitando a
 * indisponibilidade de cada professor e tentando encaixar aulas geminadas
 * (2 seguidas, mesmo dia) quando marcado. Estratégia gulosa com ordem
 * "mais restrito primeiro" (menos professores candidatos primeiro) e busca
 * exaustiva por necessidade — só desiste de uma aula quando não existe
 * mesmo nenhum horário válido restante, não por falta de sorte. Quando não
 * há slot válido, registra o motivo real do conflito com uma sugestão em
 * vez de travar a geração. Blocos do tipo "intervalo" nunca recebem aula.
 *
 * Cada turma só usa os blocos do próprio turno (`blocos.turno`) — turnos
 * diferentes podem ter horários totalmente distintos (ex: matutino 07h-12h,
 * noturno 19h-22h30). A ocupação do professor (incluindo indisponibilidade)
 * é rastreada pelo horário de início real (não pelo índice do bloco), pra
 * pegar conflito mesmo entre turnos que se sobrepõem no relógio (ex: um
 * professor em turma integral e outra matutina ao mesmo tempo).
 */
export function gerarHorarios(
  turmas: Turma[],
  professores: Professor[],
  blocos: BlocoHorario[],
  disciplinas: Disciplina[],
): GeneratedSchedule {
  const grades: Record<string, Grade> = {}
  const conflitos: string[] = []

  const nomeDisciplina = (disciplinaId: string) =>
    disciplinas.find((d) => d.id === disciplinaId)?.nome ?? disciplinaId

  // --- pré-cálculo por turno (uma vez, reaproveitado por toda turma daquele turno) ---
  const blocosPorTurno = new Map<Periodo, BlocoHorario[]>()
  const blocosAulaPorTurno = new Map<Periodo, BlocoIndexado[]>()
  const paresPorTurno = new Map<Periodo, ParConsecutivo[]>()
  for (const turno of PERIODOS) {
    const lista = blocos.filter((b) => b.turno === turno)
    blocosPorTurno.set(turno, lista)
    blocosAulaPorTurno.set(
      turno,
      lista.map((b, index) => ({ ...b, index })).filter((b) => b.tipo === "aula"),
    )
    paresPorTurno.set(turno, paresConsecutivos(lista))
  }

  // ocupacao[professorId] = Set("diaIndex-horaInicio") — pré-semeado com a
  // indisponibilidade de cada professor, que passa a funcionar como só mais
  // uma entrada "ocupada" nesse mesmo Set (sem precisar de um mapa paralelo).
  const ocupacaoProfessor = new Map<string, Set<string>>()
  for (const p of professores) {
    const bloqueado = new Set<string>()
    for (const { dia, horario } of p.indisponibilidades) {
      const diaIdx = DIAS_SEMANA.findIndex((d) => d === dia)
      if (diaIdx === -1) continue // ex: "Sáb", fora do escopo do gerador (só Seg-Sex)
      bloqueado.add(`${diaIdx}-${horario}`)
    }
    ocupacaoProfessor.set(p.id, bloqueado)
  }
  const marcarOcupado = (professorId: string, key: string) => {
    ocupacaoProfessor.get(professorId)!.add(key)
  }

  for (const turma of turmas) {
    grades[turma.id] = emptyGrade((blocosPorTurno.get(turma.turno) ?? []).length)
  }

  // turmas vazio pra essa disciplina = professor aceita qualquer turma que precise dela
  const professorPorDisciplina = (disciplinaId: string, turmaId: string): Professor[] =>
    professores.filter((p) => {
      const turmasPermitidas = p.turmasPorDisciplina[disciplinaId]
      if (turmasPermitidas === undefined) return false
      return turmasPermitidas.length === 0 || turmasPermitidas.includes(turmaId)
    })

  // --- fila global de necessidades (todas as turmas competem pela mesma fila,
  // já que professor é recurso compartilhado entre elas) ---
  const necessidades: Necessidade[] = []
  for (const turma of turmas) {
    const blocosAula = blocosAulaPorTurno.get(turma.turno) ?? []
    if (blocosAula.length === 0) {
      conflitos.push(
        `${turma.nome}: nenhum horário de aula configurado para o turno "${turma.turno}" — configure em Configurações.`,
      )
      continue
    }
    for (const [disciplinaId, quantidade] of Object.entries(turma.cargaHoraria)) {
      if (quantidade <= 0) continue
      const candidatos = professorPorDisciplina(disciplinaId, turma.id)
      if (candidatos.length === 0) {
        conflitos.push(
          `Nenhum professor cadastrado para a disciplina "${nomeDisciplina(disciplinaId)}" (${turma.nome}) — cadastre um professor pra essa disciplina ou libere um já existente na aba Professores.`,
        )
        continue
      }
      necessidades.push({
        turma,
        disciplinaId,
        quantidade,
        candidatos,
        geminada: turma.cargaHorariaGeminada[disciplinaId] ?? false,
      })
    }
  }

  // mais restrito primeiro (menos professores candidatos), geminada antes de
  // avulsa em caso de empate (precisa reivindicar pares contíguos escassos
  // antes que necessidades avulsas consumam blocos que completariam um par),
  // desempate final por quantidade maior primeiro. Embaralha ANTES de
  // ordenar (sort é estável) pra empates não favorecerem sempre a mesma
  // turma — sem isso, quando duas turmas disputam o mesmo professor escasso
  // pra mesma disciplina (empate exato nos critérios), a turma que aparece
  // primeiro no array sempre reivindica tudo primeiro, toda vez, deixando a
  // outra sistematicamente sem nada nessa disciplina.
  const necessidadesEmbaralhadas = shuffle(necessidades)
  necessidadesEmbaralhadas.sort((x, y) => {
    if (x.candidatos.length !== y.candidatos.length) return x.candidatos.length - y.candidatos.length
    if (x.geminada !== y.geminada) return x.geminada ? -1 : 1
    return y.quantidade - x.quantidade
  })

  for (const necessidade of necessidadesEmbaralhadas) {
    const { turma, disciplinaId, quantidade, candidatos, geminada } = necessidade
    const grade = grades[turma.id]
    const blocosAula = blocosAulaPorTurno.get(turma.turno) ?? []
    const usosPorDia = DIAS_SEMANA.map(() => 0)
    let colocadas = 0
    let paresNaoEncontrados = 0

    if (geminada) {
      const pares = paresPorTurno.get(turma.turno) ?? []
      const nPares = Math.floor(quantidade / 2)
      let avulsas = quantidade % 2

      for (let i = 0; i < nPares; i++) {
        const resultado = buscarParExaustivo(pares, candidatos, ocupacaoProfessor, usosPorDia, grade)
        if (!resultado) {
          // já esgotou a busca uma vez pra esse par — vai falhar de novo, então
          // não insiste: converte o que sobrou em tentativas avulsas.
          avulsas += (nPares - i) * 2
          paresNaoEncontrados += nPares - i
          break
        }
        const { dia, a, b, professor } = resultado
        grade[dia][a.index] = { disciplinaId, professorId: professor.id }
        grade[dia][b.index] = { disciplinaId, professorId: professor.id }
        marcarOcupado(professor.id, `${dia}-${a.inicio}`)
        marcarOcupado(professor.id, `${dia}-${b.inicio}`)
        usosPorDia[dia] += 2
        colocadas += 2
      }

      for (let i = 0; i < avulsas; i++) {
        const resultado = buscarSlotExaustivo(blocosAula, candidatos, ocupacaoProfessor, usosPorDia, grade)
        if (!resultado) break
        const { dia, bloco, professor } = resultado
        grade[dia][bloco.index] = { disciplinaId, professorId: professor.id }
        marcarOcupado(professor.id, `${dia}-${bloco.inicio}`)
        usosPorDia[dia]++
        colocadas++
      }
    } else {
      for (let i = 0; i < quantidade; i++) {
        const resultado = buscarSlotExaustivo(blocosAula, candidatos, ocupacaoProfessor, usosPorDia, grade)
        if (!resultado) break
        const { dia, bloco, professor } = resultado
        grade[dia][bloco.index] = { disciplinaId, professorId: professor.id }
        marcarOcupado(professor.id, `${dia}-${bloco.inicio}`)
        usosPorDia[dia]++
        colocadas++
      }
    }

    if (colocadas < quantidade) {
      const totalSlots = DIAS_SEMANA.length * blocosAula.length
      const usados = grade.reduce((soma, linha) => soma + linha.filter((c) => c !== null).length, 0)
      const motivo =
        usados >= totalSlots
          ? `a grade de "${turma.nome}" não tem mais horário livre — todos os ${totalSlots} horários de aula da semana já estão ocupados. Adicione mais horários ao turno "${turma.turno}" em Configurações, ou reduza a carga horária total.`
          : `os professores aptos pra "${nomeDisciplina(disciplinaId)}" já estão ocupados ou indisponíveis nos horários livres restantes de "${turma.nome}". Cadastre outro professor pra essa disciplina, amplie a disponibilidade dos existentes, ou reduza a carga horária.`
      conflitos.push(
        `${turma.nome}: só foi possível alocar ${colocadas}/${quantidade} aula(s) de "${nomeDisciplina(disciplinaId)}" — ${motivo}`,
      )
    } else if (paresNaoEncontrados > 0) {
      conflitos.push(
        `${turma.nome}: ${paresNaoEncontrados} par(es) de aula geminada de "${nomeDisciplina(disciplinaId)}" não coube(ram) 2 horários seguidos livres — foram encaixadas avulsas em vez de seguidas.`,
      )
    }
  }

  return { grades, conflitos }
}
