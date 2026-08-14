import {
  DIAS_SEMANA,
  PERIODOS,
  tipoEfetivo,
  type BlocoHorario,
  type Disciplina,
  type GrupoCoincidencia,
  type GrupoDisciplinas,
  type Periodo,
  type Professor,
  type Recurso,
  type TipoAula,
  type Turma,
} from "@/data/mockData"

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
  tipo: TipoAula
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
interface MembroCoincidencia {
  turma: Turma
  blocosAula: BlocoIndexado[]
  candidatos: Professor[]
}
interface SlotCoincidenteEncontrado {
  dia: number
  horario: string
  atribuicoes: { turmaId: string; blocoIndex: number; professorId: string }[]
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

interface OpcaoComDiaEProfessor {
  dia: number
  professor: Professor
}

/**
 * Ordena as opções válidas encontradas por uma busca exaustiva. Quando o
 * professor da opção tem `concentrarDias` marcado, prioriza dias em que ele
 * JÁ dá aula (mais uso primeiro) — pra concentrar a semana dele em menos
 * dias e sobrar algum livre. Só reordena entre opções já válidas, nunca
 * descarta nenhuma, então não pode criar conflito que não existiria sem a
 * preferência (ver `Professor.concentrarDias`). Sem isso — ou pra
 * professores sem a preferência — mantém o critério padrão: dia menos
 * usado por essa necessidade primeiro, pra espalhar a disciplina ao longo
 * da semana em vez de empilhar tudo nos mesmos dias.
 */
function ordenarPreferindoConcentracao<T extends OpcaoComDiaEProfessor>(
  opcoes: T[],
  usosPorDia: number[],
  usosPorDiaProfessor?: Map<string, number[]>,
): void {
  opcoes.sort((a, b) => {
    if (usosPorDiaProfessor) {
      const usoA = a.professor.concentrarDias ? usosPorDiaProfessor.get(a.professor.id)![a.dia] : 0
      const usoB = b.professor.concentrarDias ? usosPorDiaProfessor.get(b.professor.id)![b.dia] : 0
      if (usoA !== usoB) return usoB - usoA
    }
    return usosPorDia[a.dia] - usosPorDia[b.dia]
  })
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
  /** filtro extra por (dia,bloco) — usado pra moldar como os Tipos G/H encadeiam aulas no mesmo dia (ver `permiteAdjacenciaSeDobra`) */
  permitido?: (diaIdx: number, bloco: BlocoIndexado) => boolean,
  /** ver `ordenarPreferindoConcentracao` */
  usosPorDiaProfessor?: Map<string, number[]>,
): SlotEncontrado | null {
  const candidatosEmbaralhados = shuffle(candidatos)
  const blocosEmbaralhados = shuffle(blocosAula)
  const opcoes: SlotEncontrado[] = []

  for (const diaIdx of shuffle(DIAS_SEMANA.map((_, i) => i))) {
    for (const bloco of blocosEmbaralhados) {
      if (grade[diaIdx][bloco.index] !== null) continue
      if (permitido && !permitido(diaIdx, bloco)) continue
      const key = `${diaIdx}-${bloco.inicio}`
      const professor = candidatosEmbaralhados.find((p) => !ocupacaoProfessor.get(p.id)?.has(key))
      if (professor) opcoes.push({ dia: diaIdx, bloco, professor })
    }
  }

  if (opcoes.length === 0) return null
  ordenarPreferindoConcentracao(opcoes, usosPorDia, usosPorDiaProfessor)
  return opcoes[0]
}

/** Mesma ideia de `buscarSlotExaustivo`, mas pra um par geminado — precisa do mesmo professor livre nos dois horários. */
function buscarParExaustivo(
  pares: ParConsecutivo[],
  candidatos: Professor[],
  ocupacaoProfessor: Map<string, Set<string>>,
  usosPorDia: number[],
  grade: Grade,
  /** filtro extra por (dia,par) — mesma ideia do `permitido` de `buscarSlotExaustivo`, aplicado aos dois blocos do par */
  permitido?: (diaIdx: number, par: ParConsecutivo) => boolean,
  /** ver `ordenarPreferindoConcentracao` */
  usosPorDiaProfessor?: Map<string, number[]>,
): ParEncontrado | null {
  const candidatosEmbaralhados = shuffle(candidatos)
  const paresEmbaralhados = shuffle(pares)
  const opcoes: ParEncontrado[] = []

  for (const diaIdx of shuffle(DIAS_SEMANA.map((_, i) => i))) {
    for (const par of paresEmbaralhados) {
      if (grade[diaIdx][par.a.index] !== null || grade[diaIdx][par.b.index] !== null) continue
      if (permitido && !permitido(diaIdx, par)) continue
      const keyA = `${diaIdx}-${par.a.inicio}`
      const keyB = `${diaIdx}-${par.b.inicio}`
      const professor = candidatosEmbaralhados.find(
        (p) => !ocupacaoProfessor.get(p.id)?.has(keyA) && !ocupacaoProfessor.get(p.id)?.has(keyB),
      )
      if (professor) opcoes.push({ dia: diaIdx, a: par.a, b: par.b, professor })
    }
  }

  if (opcoes.length === 0) return null
  ordenarPreferindoConcentracao(opcoes, usosPorDia, usosPorDiaProfessor)
  return opcoes[0]
}

/**
 * Acha um (dia,horário) em que TODAS as turmas do grupo de coincidência têm
 * o slot livre e um professor candidato livre — cada turma pode ficar com
 * um professor diferente (só o horário é sincronizado), mas nenhum
 * professor pode ser escalado em duas turmas do grupo ao mesmo tempo.
 * Exaustiva como as outras buscas: testa toda combinação (dia,horário)
 * comum às turmas do grupo antes de desistir.
 */
function buscarSlotCoincidenteExaustivo(
  membros: MembroCoincidencia[],
  grades: Record<string, Grade>,
  ocupacaoProfessor: Map<string, Set<string>>,
  /** filtro extra por (dia,horário) — usado pra checar capacidade de recurso somando todas as turmas do grupo de uma vez */
  permitido: (diaIdx: number, horario: string) => boolean,
): SlotCoincidenteEncontrado | null {
  const horariosComuns = membros
    .map((m) => new Set(m.blocosAula.map((b) => b.inicio)))
    .reduce((a, b) => new Set([...a].filter((h) => b.has(h))))
  const opcoes: SlotCoincidenteEncontrado[] = []

  for (const diaIdx of shuffle(DIAS_SEMANA.map((_, i) => i))) {
    for (const horario of shuffle([...horariosComuns])) {
      if (!permitido(diaIdx, horario)) continue
      const key = `${diaIdx}-${horario}`
      const usadosNesseSlot = new Set<string>()
      const atribuicoes: { turmaId: string; blocoIndex: number; professorId: string }[] = []
      let ok = true
      for (const m of membros) {
        const bloco = m.blocosAula.find((b) => b.inicio === horario)!
        if (grades[m.turma.id][diaIdx][bloco.index] !== null) {
          ok = false
          break
        }
        const professor = shuffle(m.candidatos).find(
          (p) => !ocupacaoProfessor.get(p.id)?.has(key) && !usadosNesseSlot.has(p.id),
        )
        if (!professor) {
          ok = false
          break
        }
        usadosNesseSlot.add(professor.id)
        atribuicoes.push({ turmaId: m.turma.id, blocoIndex: bloco.index, professorId: professor.id })
      }
      if (ok) opcoes.push({ dia: diaIdx, horario, atribuicoes })
    }
  }

  if (opcoes.length === 0) return null
  return shuffle(opcoes)[0]
}

/**
 * Tipos G/H permitem até 2 aulas da mesma necessidade (turma+disciplina) no
 * mesmo dia — mas só quando esse segundo horário é adjacente ao primeiro
 * (G tenta, H exige). `usosNoDia` guarda os índices de bloco já colocados
 * nesse dia especificamente por essa necessidade (nunca mais que 2). Um dia
 * ainda sem nenhuma aula dessa necessidade sempre é permitido — isso é o que
 * garante que o Tipo nunca reduz a capacidade total de horários disponíveis
 * em relação ao comportamento sem Tipo, só molda ONDE a 2ª aula do dia cai.
 */
function permiteAdjacenciaSeDobra(
  usosNoDia: Map<number, number[]>,
  diaIdx: number,
  bloco: BlocoIndexado,
  paresIndex: Set<string>,
  exigirAdjacencia: boolean,
): boolean {
  const usados = usosNoDia.get(diaIdx) ?? []
  if (usados.length === 0) return true
  if (usados.length >= 2) return false
  if (!exigirAdjacencia) return true
  const existente = usados[0]
  const key = existente < bloco.index ? `${existente}-${bloco.index}` : `${bloco.index}-${existente}`
  return paresIndex.has(key)
}

/** true pros Tipos que reservam um par geminado antes de qualquer avulsa (K, L, N). */
const precisaDePar = (tipo: TipoAula) => tipo === "K" || tipo === "L" || tipo === "N"

/**
 * Tipo que vale pra essa necessidade (turma+disciplina), a partir do
 * professor candidato — na prática quase sempre há só 1 candidato pra cada
 * turma+disciplina, então o primeiro é representativo o bastante (o gerador
 * só decide qual professor real assume cada aula na hora de encaixar, não
 * antes). Compatibilidade com contas que nunca mexeram em Tipo: o padrão
 * "A" (nunca configurado de propósito, é o valor inicial de toda
 * disciplina nova) cai de volta pro checkbox antigo "aula geminada" da
 * turma — só um Tipo explicitamente diferente de "A" passa a valer.
 */
function tipoDaNecessidade(candidatos: Professor[], turma: Turma, disciplinaId: string): TipoAula {
  const config = candidatos[0]?.turmasPorDisciplina[disciplinaId]
  const base = tipoEfetivo(config, turma.id)
  if (base !== "A") return base
  return turma.cargaHorariaGeminada[disciplinaId] ? "N" : "A"
}

/**
 * Gera a grade horária de todas as turmas evitando que um mesmo professor
 * seja escalado em duas turmas no mesmo dia/horário, respeitando a
 * indisponibilidade de cada professor e encadeando as aulas de cada
 * necessidade (turma+disciplina) conforme o Tipo (A/G/H/K/L/N) do professor
 * pra aquela disciplina/turma — ver `tipoDaNecessidade` e `TIPOS_AULA` em
 * mockData.ts. Estratégia gulosa com ordem "mais restrito primeiro" (menos
 * professores candidatos primeiro) e busca exaustiva por necessidade — só
 * desiste de uma aula quando não existe mesmo nenhum horário válido
 * restante, não por falta de sorte. Quando não há slot válido, registra o
 * motivo real do conflito com uma sugestão em vez de travar a geração.
 * Blocos do tipo "intervalo" nunca recebem aula.
 *
 * Cada turma só usa os blocos do próprio turno (`blocos.turno`) — turnos
 * diferentes podem ter horários totalmente distintos (ex: matutino 07h-12h,
 * noturno 19h-22h30). A ocupação do professor (incluindo indisponibilidade)
 * é rastreada pelo horário de início real (não pelo índice do bloco), pra
 * pegar conflito mesmo entre turnos que se sobrepõem no relógio (ex: um
 * professor em turma integral e outra matutina ao mesmo tempo) — recursos
 * compartilhados (`recursos`) usam a mesma chave por esse mesmo motivo.
 */
export function gerarHorarios(
  turmas: Turma[],
  professores: Professor[],
  blocos: BlocoHorario[],
  disciplinas: Disciplina[],
  recursos: Recurso[] = [],
  gruposCoincidencia: GrupoCoincidencia[] = [],
  gruposDisciplinas: GrupoDisciplinas[] = [],
): GeneratedSchedule {
  const grades: Record<string, Grade> = {}
  const conflitos: string[] = []

  const nomeDisciplina = (disciplinaId: string) =>
    disciplinas.find((d) => d.id === disciplinaId)?.nome ?? disciplinaId

  // --- pré-cálculo por turno (uma vez, reaproveitado por toda turma daquele turno) ---
  const blocosPorTurno = new Map<Periodo, BlocoHorario[]>()
  const blocosAulaPorTurno = new Map<Periodo, BlocoIndexado[]>()
  const paresPorTurno = new Map<Periodo, ParConsecutivo[]>()
  const paresIndexPorTurno = new Map<Periodo, Set<string>>()
  for (const turno of PERIODOS) {
    const lista = blocos.filter((b) => b.turno === turno)
    blocosPorTurno.set(turno, lista)
    blocosAulaPorTurno.set(
      turno,
      lista.map((b, index) => ({ ...b, index })).filter((b) => b.tipo === "aula"),
    )
    const pares = paresConsecutivos(lista)
    paresPorTurno.set(turno, pares)
    paresIndexPorTurno.set(turno, new Set(pares.map((par) => `${par.a.index}-${par.b.index}`)))
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

  // usosPorDiaProfessor[professorId][diaIdx] = quantas aulas esse professor já
  // tem nesse dia, em QUALQUER turma/disciplina — usado só pra decidir a
  // ORDEM de preferência entre slots já válidos quando `concentrarDias` está
  // marcado (ver `ordenarPreferindoConcentracao`); nunca bloqueia nada.
  const usosPorDiaProfessor = new Map<string, number[]>()
  for (const p of professores) {
    usosPorDiaProfessor.set(p.id, DIAS_SEMANA.map(() => 0))
  }
  const marcarOcupado = (professorId: string, dia: number, horario: string) => {
    ocupacaoProfessor.get(professorId)!.add(`${dia}-${horario}`)
    usosPorDiaProfessor.get(professorId)![dia]++
  }

  // recursoOcupacao[recursoId] = Map("diaIndex-horaInicio" -> quantas turmas já
  // estão usando esse recurso nesse horário) — mesma chave da ocupação de
  // professor, então um recurso compartilhado entre turnos sobrepostos
  // também é respeitado.
  const recursoOcupacao = new Map<string, Map<string, number>>()
  for (const r of recursos) {
    recursoOcupacao.set(r.id, new Map())
  }
  const recursosDaDisciplina = (disciplinaId: string): Recurso[] => recursos.filter((r) => r.disciplinaIds.includes(disciplinaId))

  // usoGrupoDisciplinaPorDia[`${turmaId}::${grupoId}`][diaIdx] = quantas
  // aulas de disciplinas desse grupo essa turma já tem nesse dia, somando
  // TODAS as disciplinas do grupo — ver Controles → Limitar grupo de
  // disciplinas. Global (não por necessidade) porque disciplinas diferentes
  // do mesmo grupo geram necessidades separadas mas competem pelo mesmo cap.
  const usoGrupoDisciplinaPorDia = new Map<string, number[]>()
  const gruposDaDisciplina = (disciplinaId: string): GrupoDisciplinas[] =>
    gruposDisciplinas.filter((g) => g.disciplinaIds.includes(disciplinaId))

  for (const turma of turmas) {
    grades[turma.id] = emptyGrade((blocosPorTurno.get(turma.turno) ?? []).length)
  }

  // --- aulas fixas (Controles → Fixar Aulas): coloca ANTES de tudo, nunca
  // move nem é sobrescrita pelo resto do algoritmo — e desconta da carga
  // horária normal da disciplina antes de montar a fila de necessidades, pra
  // não gerar aula duplicada da mesma disciplina além da fixa.
  const fixasColocadas = new Map<string, number>() // `${turmaId}::${disciplinaId}` -> quantas já fixadas
  for (const turma of turmas) {
    const blocosAula = blocosAulaPorTurno.get(turma.turno) ?? []
    const grade = grades[turma.id]
    for (const fixa of turma.aulasFixas) {
      const diaIdx = DIAS_SEMANA.findIndex((d) => d === fixa.dia)
      const bloco = blocosAula.find((b) => b.inicio === fixa.horario)
      const nomeProf = professores.find((p) => p.id === fixa.professorId)?.nome

      if (diaIdx === -1 || !bloco || !nomeProf) {
        conflitos.push(
          `${turma.nome}: aula fixa de "${nomeDisciplina(fixa.disciplinaId)}" em ${fixa.dia} ${fixa.horario} não é mais válida (dia, horário ou professor não existe mais) — remova e refaça em Controles → Fixar Aulas.`,
        )
        continue
      }
      if (grade[diaIdx][bloco.index] !== null) {
        conflitos.push(`${turma.nome}: duas aulas fixas disputam ${fixa.dia} ${fixa.horario} — só uma pôde ser colocada.`)
        continue
      }
      const key = `${diaIdx}-${fixa.horario}`
      if (ocupacaoProfessor.get(fixa.professorId)?.has(key)) {
        conflitos.push(
          `${turma.nome}: ${nomeProf} já está ocupado (outra aula fixa ou indisponibilidade) em ${fixa.dia} ${fixa.horario} — a aula fixa de "${nomeDisciplina(fixa.disciplinaId)}" não pôde ser colocada.`,
        )
        continue
      }
      const recursosDaFixa = recursosDaDisciplina(fixa.disciplinaId)
      const cabeNosRecursos = recursosDaFixa.every((r) => (recursoOcupacao.get(r.id)?.get(key) ?? 0) < r.quantidade)
      if (!cabeNosRecursos) {
        conflitos.push(
          `${turma.nome}: recurso necessário pra "${nomeDisciplina(fixa.disciplinaId)}" já está no limite em ${fixa.dia} ${fixa.horario} — a aula fixa não pôde ser colocada.`,
        )
        continue
      }

      grade[diaIdx][bloco.index] = { disciplinaId: fixa.disciplinaId, professorId: fixa.professorId }
      marcarOcupado(fixa.professorId, diaIdx, fixa.horario)
      for (const r of recursosDaFixa) {
        const mapa = recursoOcupacao.get(r.id)!
        mapa.set(key, (mapa.get(key) ?? 0) + 1)
      }
      const fixaKey = `${turma.id}::${fixa.disciplinaId}`
      fixasColocadas.set(fixaKey, (fixasColocadas.get(fixaKey) ?? 0) + 1)
    }
  }

  // turmas vazio pra essa disciplina = professor aceita qualquer turma que precise dela
  const professorPorDisciplina = (disciplinaId: string, turmaId: string): Professor[] =>
    professores.filter((p) => {
      const config = p.turmasPorDisciplina[disciplinaId]
      if (config === undefined) return false
      return config.turmaIds.length === 0 || config.turmaIds.includes(turmaId)
    })

  // --- grupos de coincidência (Controles → Turmas → Coincidir aulas): força
  // as turmas do grupo a terem a mesma disciplina no mesmo dia/horário —
  // coloca ANTES da fila normal (mesmo espírito das aulas fixas, mas
  // escolhendo o slot automaticamente em vez de um horário fixo) e desconta
  // da carga horária de cada turma membro antes de montar a fila.
  const coincidenciasColocadas = new Map<string, number>() // `${turmaId}::${disciplinaId}` -> quantas já coincidiram
  for (const grupo of gruposCoincidencia) {
    const membros: MembroCoincidencia[] = grupo.turmaIds
      .map((turmaId) => turmas.find((t) => t.id === turmaId))
      .filter((t): t is Turma => t !== undefined)
      .map((turma) => ({
        turma,
        blocosAula: blocosAulaPorTurno.get(turma.turno) ?? [],
        candidatos: professorPorDisciplina(grupo.disciplinaId, turma.id),
      }))

    if (membros.length < 2) continue // grupo com 0-1 turma válida não tem o que coincidir
    const semCondicao = membros.find((m) => m.blocosAula.length === 0 || m.candidatos.length === 0)
    if (semCondicao) {
      conflitos.push(
        `Grupo "${grupo.nome}": "${semCondicao.turma.nome}" não tem horário de aula configurado ou professor pra "${nomeDisciplina(grupo.disciplinaId)}" — as aulas desse grupo não foram coincididas.`,
      )
      continue
    }

    const recursosDoGrupo = recursosDaDisciplina(grupo.disciplinaId)
    // mesmas restrições que uma necessidade normal respeitaria pra essa
    // disciplina — Coincidir Aulas não pode ser um jeito de burlar Limitar
    // Horários ou Limitar grupo de disciplinas, senão as regras conversam
    // mal entre si e o resultado final vira uma surpresa pro usuário.
    const horariosPermitidosDoGrupo = disciplinas.find((d) => d.id === grupo.disciplinaId)?.horariosPermitidos
    const cabeNoHorarioDoGrupo = (horario: string): boolean =>
      !horariosPermitidosDoGrupo || horariosPermitidosDoGrupo.length === 0 || horariosPermitidosDoGrupo.includes(horario)
    const gruposDisciplinasDoGrupo = gruposDaDisciplina(grupo.disciplinaId)
    const cabeNoGrupoDisciplinasParaTodos = (dia: number): boolean =>
      membros.every((m) =>
        gruposDisciplinasDoGrupo.every((gd) => {
          const usos = usoGrupoDisciplinaPorDia.get(`${m.turma.id}::${gd.id}`) ?? DIAS_SEMANA.map(() => 0)
          return usos[dia] + 1 <= gd.maxPorDia
        }),
      )
    const quantidadeCoincidente = Math.min(...membros.map((m) => m.turma.cargaHoraria[grupo.disciplinaId] ?? 0))

    for (let i = 0; i < quantidadeCoincidente; i++) {
      const resultado = buscarSlotCoincidenteExaustivo(membros, grades, ocupacaoProfessor, (dia, horario) => {
        if (!cabeNoHorarioDoGrupo(horario)) return false
        if (!cabeNoGrupoDisciplinasParaTodos(dia)) return false
        const key = `${dia}-${horario}`
        return recursosDoGrupo.every((r) => (recursoOcupacao.get(r.id)?.get(key) ?? 0) + membros.length <= r.quantidade)
      })
      if (!resultado) {
        conflitos.push(
          `Grupo "${grupo.nome}": só foi possível coincidir ${i}/${quantidadeCoincidente} aula(s) de "${nomeDisciplina(grupo.disciplinaId)}" — não sobrou nenhum dia/horário livre em todas as turmas do grupo ao mesmo tempo (considerando horários permitidos e limites de grupo de disciplinas).`,
        )
        break
      }
      const { dia, horario, atribuicoes } = resultado
      for (const atrib of atribuicoes) {
        grades[atrib.turmaId][dia][atrib.blocoIndex] = { disciplinaId: grupo.disciplinaId, professorId: atrib.professorId }
        marcarOcupado(atrib.professorId, dia, horario)
        const chave = `${atrib.turmaId}::${grupo.disciplinaId}`
        coincidenciasColocadas.set(chave, (coincidenciasColocadas.get(chave) ?? 0) + 1)
        for (const gd of gruposDisciplinasDoGrupo) {
          const chaveGrupo = `${atrib.turmaId}::${gd.id}`
          const usos = usoGrupoDisciplinaPorDia.get(chaveGrupo) ?? DIAS_SEMANA.map(() => 0)
          usos[dia]++
          usoGrupoDisciplinaPorDia.set(chaveGrupo, usos)
        }
      }
      const chaveHorario = `${dia}-${horario}`
      for (const r of recursosDoGrupo) {
        const mapa = recursoOcupacao.get(r.id)!
        mapa.set(chaveHorario, (mapa.get(chaveHorario) ?? 0) + membros.length)
      }
    }
  }

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
    for (const [disciplinaId, quantidadeTotal] of Object.entries(turma.cargaHoraria)) {
      if (quantidadeTotal <= 0) continue
      const jaResolvidas =
        (fixasColocadas.get(`${turma.id}::${disciplinaId}`) ?? 0) + (coincidenciasColocadas.get(`${turma.id}::${disciplinaId}`) ?? 0)
      const quantidade = quantidadeTotal - jaResolvidas
      if (quantidade <= 0) continue // toda a carga horária já foi coberta por aula(s) fixa(s) e/ou coincidida(s)
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
        tipo: tipoDaNecessidade(candidatos, turma, disciplinaId),
      })
    }
  }

  // mais restrito primeiro (menos professores candidatos), Tipos que
  // reservam par geminado (K/L/N) antes de avulsa em caso de empate (precisa
  // reivindicar pares contíguos escassos antes que necessidades avulsas
  // consumam blocos que completariam um par), desempate final por
  // quantidade maior primeiro. Embaralha ANTES de ordenar (sort é estável)
  // pra empates não favorecerem sempre a mesma turma — sem isso, quando
  // duas turmas disputam o mesmo professor escasso pra mesma disciplina
  // (empate exato nos critérios), a turma que aparece primeiro no array
  // sempre reivindica tudo primeiro, toda vez, deixando a outra
  // sistematicamente sem nada nessa disciplina.
  const necessidadesEmbaralhadas = shuffle(necessidades)
  necessidadesEmbaralhadas.sort((x, y) => {
    if (x.candidatos.length !== y.candidatos.length) return x.candidatos.length - y.candidatos.length
    if (precisaDePar(x.tipo) !== precisaDePar(y.tipo)) return precisaDePar(x.tipo) ? -1 : 1
    return y.quantidade - x.quantidade
  })

  for (const necessidade of necessidadesEmbaralhadas) {
    const { turma, disciplinaId, quantidade, candidatos, tipo } = necessidade
    const grade = grades[turma.id]
    const blocosAula = blocosAulaPorTurno.get(turma.turno) ?? []
    const pares = paresPorTurno.get(turma.turno) ?? []
    const paresIndex = paresIndexPorTurno.get(turma.turno) ?? new Set<string>()
    const usosPorDia = DIAS_SEMANA.map(() => 0)
    // dia -> índices de bloco já usados por ESSA necessidade (não a turma
    // toda) — é o que permite aos Tipos G/H decidirem se uma 2ª aula no
    // mesmo dia precisa (ou tenta) cair adjacente à 1ª.
    const usosNoDiaPelaNecessidade = new Map<number, number[]>()
    let colocadas = 0
    let paresNaoEncontrados = 0

    // grupos de disciplinas (Controles → Limitar grupo de disciplinas) que
    // essa disciplina integra, com o cap de aulas/dia de cada um.
    const gruposNecessarios = gruposDaDisciplina(disciplinaId)
    // unidades=2 pro par geminado (conta as 2 aulas do par de uma vez —
    // checar só a 1ª deixaria passar um par que estoura o cap no total).
    const cabeNoGrupo = (dia: number, unidades = 1): boolean =>
      gruposNecessarios.every((g) => {
        const usos = usoGrupoDisciplinaPorDia.get(`${turma.id}::${g.id}`) ?? DIAS_SEMANA.map(() => 0)
        return usos[dia] + unidades <= g.maxPorDia
      })
    const marcarGrupoUsado = (dia: number) => {
      for (const g of gruposNecessarios) {
        const chave = `${turma.id}::${g.id}`
        const usos = usoGrupoDisciplinaPorDia.get(chave) ?? DIAS_SEMANA.map(() => 0)
        usos[dia]++
        usoGrupoDisciplinaPorDia.set(chave, usos)
      }
    }

    const registrarColocacao = (dia: number, blocoIndex: number) => {
      usosPorDia[dia]++
      colocadas++
      const lista = usosNoDiaPelaNecessidade.get(dia) ?? []
      lista.push(blocoIndex)
      usosNoDiaPelaNecessidade.set(dia, lista)
      marcarGrupoUsado(dia)
    }

    // recursos (sala/laboratório/quadra) que essa disciplina consome — se
    // vazio, os dois helpers abaixo são no-op e o recurso nunca restringe
    // a busca (comportamento idêntico a antes de existir Recurso).
    const recursosNecessarios = recursosDaDisciplina(disciplinaId)
    const cabeNoRecurso = (dia: number, bloco: BlocoIndexado): boolean => {
      if (recursosNecessarios.length === 0) return true
      const key = `${dia}-${bloco.inicio}`
      return recursosNecessarios.every((r) => (recursoOcupacao.get(r.id)?.get(key) ?? 0) < r.quantidade)
    }
    const marcarRecursoOcupado = (dia: number, bloco: BlocoIndexado) => {
      if (recursosNecessarios.length === 0) return
      const key = `${dia}-${bloco.inicio}`
      for (const r of recursosNecessarios) {
        const mapa = recursoOcupacao.get(r.id)!
        mapa.set(key, (mapa.get(key) ?? 0) + 1)
      }
    }

    // horários (turno-agnóstico, ver Disciplina.horariosPermitidos) em que
    // essa disciplina pode cair — vazio/undefined = sem restrição.
    const horariosPermitidos = disciplinas.find((d) => d.id === disciplinaId)?.horariosPermitidos
    const cabeNoHorario = (bloco: BlocoIndexado): boolean =>
      !horariosPermitidos || horariosPermitidos.length === 0 || horariosPermitidos.includes(bloco.inicio)

    const colocarPar = (): boolean => {
      const resultado = buscarParExaustivo(
        pares,
        candidatos,
        ocupacaoProfessor,
        usosPorDia,
        grade,
        (dia, par) =>
          cabeNoRecurso(dia, par.a) &&
          cabeNoRecurso(dia, par.b) &&
          cabeNoHorario(par.a) &&
          cabeNoHorario(par.b) &&
          cabeNoGrupo(dia, 2),
        usosPorDiaProfessor,
      )
      if (!resultado) return false
      const { dia, a, b, professor } = resultado
      grade[dia][a.index] = { disciplinaId, professorId: professor.id }
      grade[dia][b.index] = { disciplinaId, professorId: professor.id }
      marcarOcupado(professor.id, dia, a.inicio)
      marcarOcupado(professor.id, dia, b.inicio)
      marcarRecursoOcupado(dia, a)
      marcarRecursoOcupado(dia, b)
      registrarColocacao(dia, a.index)
      registrarColocacao(dia, b.index)
      return true
    }

    const colocarAvulsaLivre = (): boolean => {
      const resultado = buscarSlotExaustivo(
        blocosAula,
        candidatos,
        ocupacaoProfessor,
        usosPorDia,
        grade,
        (dia, bloco) => cabeNoRecurso(dia, bloco) && cabeNoHorario(bloco) && cabeNoGrupo(dia),
        usosPorDiaProfessor,
      )
      if (!resultado) return false
      const { dia, bloco, professor } = resultado
      grade[dia][bloco.index] = { disciplinaId, professorId: professor.id }
      marcarOcupado(professor.id, dia, bloco.inicio)
      marcarRecursoOcupado(dia, bloco)
      registrarColocacao(dia, bloco.index)
      return true
    }

    // G tenta geminar (exigirAdjacencia=false relaxa e aceita separada se não
    // der); H exige de verdade (só chamado com exigirAdjacencia=true, sem
    // segunda tentativa relaxada).
    const colocarAvulsaTentandoGeminar = (exigirAdjacencia: boolean): boolean => {
      const resultado = buscarSlotExaustivo(
        blocosAula,
        candidatos,
        ocupacaoProfessor,
        usosPorDia,
        grade,
        (dia, bloco) =>
          cabeNoRecurso(dia, bloco) &&
          cabeNoHorario(bloco) &&
          cabeNoGrupo(dia) &&
          permiteAdjacenciaSeDobra(usosNoDiaPelaNecessidade, dia, bloco, paresIndex, exigirAdjacencia),
        usosPorDiaProfessor,
      )
      if (!resultado) return false
      const { dia, bloco, professor } = resultado
      grade[dia][bloco.index] = { disciplinaId, professorId: professor.id }
      marcarOcupado(professor.id, dia, bloco.inicio)
      marcarRecursoOcupado(dia, bloco)
      registrarColocacao(dia, bloco.index)
      return true
    }

    if (tipo === "N") {
      // todas as aulas em pares (sobra 1 avulsa se ímpar) — comportamento
      // histórico do antigo checkbox "aula geminada", inalterado.
      const nPares = Math.floor(quantidade / 2)
      let avulsas = quantidade % 2
      for (let i = 0; i < nPares; i++) {
        if (!colocarPar()) {
          // já esgotou a busca uma vez pra esse par — vai falhar de novo,
          // então não insiste: converte o que sobrou em tentativas avulsas.
          avulsas += (nPares - i) * 2
          paresNaoEncontrados += nPares - i
          break
        }
      }
      for (let i = 0; i < avulsas; i++) {
        if (!colocarAvulsaLivre()) break
      }
    } else if (tipo === "K" || tipo === "L") {
      // 1 par sempre geminado; o resto vem avulso — livre no K, tentando
      // geminar entre si no L.
      let restante = quantidade
      if (quantidade >= 2) {
        if (colocarPar()) restante -= 2
        else paresNaoEncontrados = 1
      }
      for (let i = 0; i < restante; i++) {
        const colocou = tipo === "K" ? colocarAvulsaLivre() : colocarAvulsaTentandoGeminar(true) || colocarAvulsaTentandoGeminar(false)
        if (!colocou) break
      }
    } else if (tipo === "G") {
      // 1-2 aulas/dia — tenta geminar quando 2 caem no mesmo dia, mas aceita separada se não der.
      for (let i = 0; i < quantidade; i++) {
        if (!(colocarAvulsaTentandoGeminar(true) || colocarAvulsaTentandoGeminar(false))) break
      }
    } else if (tipo === "H") {
      // 1-2 aulas/dia — se caírem 2 no mesmo dia, têm que vir geminadas.
      for (let i = 0; i < quantidade; i++) {
        if (!colocarAvulsaTentandoGeminar(true)) break
      }
    } else {
      // "A" — nunca tenta geminar, cada aula cai onde houver vaga.
      for (let i = 0; i < quantidade; i++) {
        if (!colocarAvulsaLivre()) break
      }
    }

    if (colocadas < quantidade) {
      const totalSlots = DIAS_SEMANA.length * blocosAula.length
      const usados = grade.reduce((soma, linha) => soma + linha.filter((c) => c !== null).length, 0)
      const motivo =
        usados >= totalSlots
          ? `a grade de "${turma.nome}" não tem mais horário livre — todos os ${totalSlots} horários de aula da semana já estão ocupados. Adicione mais horários ao turno "${turma.turno}" em Configurações, ou reduza a carga horária total.`
          : horariosPermitidos && horariosPermitidos.length > 0
            ? `"${nomeDisciplina(disciplinaId)}" só pode cair em ${horariosPermitidos.join(", ")} (Controles → Limitar Horários) e esses horários já estão ocupados nos dias livres restantes de "${turma.nome}". Libere mais horários pra essa disciplina, ou reduza a carga horária.`
            : recursosNecessarios.length > 0
              ? `os professores aptos pra "${nomeDisciplina(disciplinaId)}" já estão ocupados/indisponíveis, ou o(s) recurso(s) ${recursosNecessarios.map((r) => r.nome).join(", ")} já está(ão) no limite de uso nos horários livres restantes de "${turma.nome}". Cadastre outro professor, aumente a quantidade do recurso em Controles → Recursos, ou reduza a carga horária.`
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
