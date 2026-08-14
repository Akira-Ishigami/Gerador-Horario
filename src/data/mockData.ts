import type { PlanId } from "@/config/branding"

export type Role = "admin" | "user"

export interface MockUser {
  id: string
  name: string
  email: string
  password: string
  role: Role
  plan: PlanId
  avatarColor: string
}

/**
 * Sem backend ainda — login confere email/senha contra esta lista + as
 * contas criadas via cadastro (guardadas em localStorage, ver AuthContext).
 * Nenhuma conta fixa de demonstração aqui de propósito — troque por uma
 * consulta real ao banco quando o backend entrar.
 */
export const MOCK_USERS: MockUser[] = []

export interface Disciplina {
  id: string
  nome: string
  cor: string
  /** ex: "MAT" pra Matemática — útil em telas apertadas (grade impressa, planilha) */
  nomeAbreviado?: string
  /** classificação livre da matéria (ex: "Regular", "Eletiva") — sem lista fixa por enquanto */
  tipo?: string
  /**
   * Horários (mesmo valor de `BlocoHorario.inicio`, ex: "07:00") em que essa
   * disciplina PODE ter aula — turno-agnóstico, mesma convenção de
   * `Professor.indisponibilidades`. Vazio/undefined = qualquer horário
   * (sem restrição). Editado em Controles → Limitar Horários.
   */
  horariosPermitidos?: string[]
}

export const DISCIPLINAS: Disciplina[] = [
  { id: "mat", nome: "Matemática", cor: "#6366f1" },
  { id: "port", nome: "Português", cor: "#ec4899" },
  { id: "cien", nome: "Ciências", cor: "#22c55e" },
  { id: "hist", nome: "História", cor: "#f59e0b" },
  { id: "geo", nome: "Geografia", cor: "#06b6d4" },
  { id: "ing", nome: "Inglês", cor: "#a855f7" },
  { id: "edf", nome: "Educação Física", cor: "#ef4444" },
  { id: "arte", nome: "Artes", cor: "#eab308" },
]

/**
 * Como as aulas de uma disciplina (com esse professor) se distribuem na
 * semana pra uma turma. Mesma ideia de "aula geminada", só que com mais
 * variações do que um booleano dá conta:
 * - A: no máximo 1 aula/dia, nunca geminada.
 * - G: 1-2 aulas/dia; se caírem 2 no mesmo dia, tenta geminar (pode vir separada).
 * - H: 1-2 aulas/dia; se caírem 2 no mesmo dia, vêm geminadas.
 * - K: 1 par sempre geminado; as demais aulas, uma por dia.
 * - L: 1 par sempre geminado; as demais tentam geminar se caírem no mesmo dia.
 * - N: todas as aulas em pares geminados (sobra 1 avulsa se o total for ímpar).
 */
export type TipoAula = "A" | "G" | "H" | "K" | "L" | "N"

export const TIPOS_AULA: { valor: TipoAula; label: string; descricao: string }[] = [
  { valor: "A", label: "Única por dia", descricao: "No máximo 1 aula por dia com esse professor." },
  { valor: "G", label: "1-2/dia, tenta geminar", descricao: "Pode ter 2 aulas no mesmo dia; se cair, tenta geminar (pode vir separada)." },
  { valor: "H", label: "1-2/dia, sempre geminada", descricao: "Pode ter 2 aulas no mesmo dia; se cair, vem geminada." },
  { valor: "K", label: "1 par fixo + avulsas", descricao: "Um par sempre geminado; as demais, uma por dia." },
  { valor: "L", label: "1 par fixo + tenta geminar", descricao: "Um par sempre geminado; as demais tentam geminar se caírem juntas." },
  { valor: "N", label: "Tudo geminado", descricao: "Todas as aulas vêm aos pares (sobra 1 avulsa se o total for ímpar)." },
]

/** Tipo que vale pra essa turma: o override em `tipoPorTurma`, senão o padrão da disciplina. */
export function tipoEfetivo(config: { tipo: TipoAula; tipoPorTurma?: Record<string, TipoAula> } | undefined, turmaId: string): TipoAula {
  return config?.tipoPorTurma?.[turmaId] ?? config?.tipo ?? "A"
}

export interface TurmasPorDisciplinaConfig {
  turmaIds: string[]
  tipo: TipoAula
  /**
   * Override de Tipo por turma específica, sobrepondo `tipo` (o padrão da
   * disciplina) só pra quem está aqui — ex: Português tipo H pro 8º ano mas
   * G pro 9º, com o mesmo professor. Editado na tela "Tipos específicos"
   * (Controles), sem mexer no padrão da disciplina.
   */
  tipoPorTurma?: Record<string, TipoAula>
}

export interface Professor {
  id: string
  nome: string
  /**
   * disciplinaId -> turmas em que ele dá ESSA disciplina especificamente
   * (lista vazia = qualquer turma que precise dela) + o tipo de encadeamento
   * das aulas dessa disciplina. Restrição por matéria (não uma única lista de
   * turmas global) porque um professor pode dar uma matéria pra escola toda e
   * outra só pra turmas específicas — ex: Educação Física pra todo mundo, mas
   * Trilha só pro 8º ano.
   */
  turmasPorDisciplina: Record<string, TurmasPorDisciplinaConfig>
  /**
   * Dia+horário em que o professor não pode dar aula. `horario` é o mesmo
   * valor de `BlocoHorario.inicio` (ex: "07:00"), sem turno associado — é a
   * mesma convenção da chave de ocupação do gerador, então funciona igual
   * pra qualquer turno em que o professor der aula. Se um horário for
   * editado depois em Configurações, indisponibilidades salvas com o valor
   * antigo simplesmente param de bater com nada (ficam "órfãs") — aceito
   * como limitação por enquanto, sem lógica de limpeza automática.
   */
  indisponibilidades: { dia: DiaSemana; horario: string }[]
  /**
   * true = o gerador tenta concentrar as aulas desse professor nos dias em
   * que ele já dá aula, em vez de espalhar pela semana — pra sobrar algum
   * dia inteiro livre (ex: professor que dá aula em mais de uma escola).
   * É só uma preferência (best-effort): nunca bloqueia um dia à força, só
   * muda a ordem de preferência entre horários já válidos — então não pode
   * criar conflito novo que não existiria sem essa flag.
   */
  concentrarDias?: boolean
}

export type Periodo = "matutino" | "vespertino" | "noturno" | "integral"

export const PERIODOS: Periodo[] = ["matutino", "vespertino", "noturno", "integral"]

export interface Turma {
  id: string
  nome: string
  turno: Periodo
  /** sala/ambiente onde a turma tem aula — só informativo, não afeta o gerador */
  sala?: string
  /** meta/total esperado de aulas por semana — só informativo por enquanto, sem validação */
  aulasSemanais?: number
  /** restrições pro gerador respeitar numa próxima etapa — só cadastro por enquanto */
  minAulasPorDia?: number
  maxAulasPorDia?: number
  /**
   * Recreio próprio dessa turma, se diferente do intervalo padrão do turno
   * (definido em Configurações → Horários). Por posição (depois de qual aula
   * do turno, 1-indexed, contando só os blocos tipo "aula" em ordem) em vez
   * de horário fixo — assim continua fazendo sentido mesmo se os horários do
   * turno forem editados depois. Só cadastro por enquanto, sem uso no
   * gerador ainda.
   */
  recreioDepoisDaAula?: number
  recreioDuracaoMin?: number
  /** código de acesso da turma (ex: consulta de horário sem login) — só cadastro por enquanto */
  codigoSecreto?: string
  /** quantidade de aulas semanais por disciplina */
  cargaHoraria: Record<string, number>
  /** true = tenta encaixar as aulas dessa matéria em pares (2 seguidas, mesmo dia) em vez de espalhadas */
  cargaHorariaGeminada: Record<string, boolean>
  /**
   * Dias da semana em que a turma tem aula. Capturado no wizard de
   * configuração, mas o gerador/grade ainda considera só Segunda a Sexta
   * (DIAS_SEMANA) — variar isso por turma é lógica pra uma próxima etapa.
   */
  diasFuncionamento: DiaSemana[]
  /**
   * Aulas "presas" num dia/horário fixo (Controles → Fixar Aulas) — o
   * gerador coloca essas primeiro, antes de distribuir o resto da carga
   * horária daquela disciplina, e nunca move nem sobrescreve o slot.
   */
  aulasFixas: AulaFixa[]
}

export interface AulaFixa {
  disciplinaId: string
  professorId: string
  dia: DiaSemana
  /** mesmo valor de `BlocoHorario.inicio` (ex: "07:00") — mesma convenção de `Professor.indisponibilidades` */
  horario: string
}

export interface Recurso {
  id: string
  nome: string
  /** quantas turmas podem usar esse recurso ao mesmo tempo (ex: 1 quadra, 2 laboratórios) */
  quantidade: number
  /** disciplinas que precisam desse recurso quando têm aula — qualquer turma com uma dessas disciplinas no horário consome 1 unidade */
  disciplinaIds: string[]
}

/**
 * "Coincidir aulas de turmas diferentes" (Controles → Turmas): força as
 * turmas do grupo a terem a mesma disciplina no mesmo dia/horário (ex:
 * todas as turmas do 8º ano com Educação Física junto, pra juntar ou
 * dividir os alunos). Cada turma pode ter um professor diferente — só o
 * horário é sincronizado, não necessariamente quem dá aula.
 */
export interface GrupoCoincidencia {
  id: string
  nome: string
  disciplinaId: string
  turmaIds: string[]
}

/**
 * "Limitar grupo de disciplinas" (Controles → Disciplinas): agrupa
 * disciplinas relacionadas (ex: "Linguagens" = Português+Inglês+Artes) e
 * limita quantas aulas do grupo somado uma turma pode ter no mesmo dia —
 * evita, por exemplo, um dia com 4 aulas seguidas da mesma área.
 */
export interface GrupoDisciplinas {
  id: string
  nome: string
  disciplinaIds: string[]
  maxPorDia: number
}

const ALFABETO_CODIGO_SECRETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // sem O/0, I/1 (confundem fácil)

/** Código curto pra identificar a turma sem depender do nome (ex: consulta de horário sem login). */
export function gerarCodigoSecreto(): string {
  let codigo = ""
  for (let i = 0; i < 6; i++) {
    codigo += ALFABETO_CODIGO_SECRETO[Math.floor(Math.random() * ALFABETO_CODIGO_SECRETO.length)]
  }
  return codigo
}

/** Usado pelo gerador/grade — mantido em 5 dias por enquanto. */
export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const
/** Usado só no wizard de configuração (inclui Sábado). */
export const DIAS_SEMANA_COMPLETA = [...DIAS_SEMANA, "Sáb"] as const
export type DiaSemana = (typeof DIAS_SEMANA_COMPLETA)[number]

export interface BlocoHorario {
  id: string
  inicio: string
  fim: string
  tipo: "aula" | "intervalo"
  /** cada turno tem seus próprios horários (matutino termina cedo, noturno começa à noite etc.) */
  turno: Periodo
}

/**
 * Configurável por conta (ver DataContext). Ponto de partida pra cada turno —
 * a escola ajusta dali em diante. DataContext semeia qualquer turno que
 * ainda não tenha nenhum horário configurado (conta nova recebe os 4 de
 * uma vez; conta existente recebe só o turno que estiver faltando).
 */
export const BLOCOS_HORARIOS_PADRAO: BlocoHorario[] = [
  // Matutino
  { id: "h1", inicio: "07:00", fim: "07:50", tipo: "aula", turno: "matutino" },
  { id: "h2", inicio: "07:50", fim: "08:40", tipo: "aula", turno: "matutino" },
  { id: "h3", inicio: "08:40", fim: "09:30", tipo: "aula", turno: "matutino" },
  { id: "h4", inicio: "09:30", fim: "09:50", tipo: "intervalo", turno: "matutino" },
  { id: "h5", inicio: "09:50", fim: "10:40", tipo: "aula", turno: "matutino" },
  { id: "h6", inicio: "10:40", fim: "11:30", tipo: "aula", turno: "matutino" },
  // Vespertino
  { id: "v1", inicio: "13:00", fim: "13:50", tipo: "aula", turno: "vespertino" },
  { id: "v2", inicio: "13:50", fim: "14:40", tipo: "aula", turno: "vespertino" },
  { id: "v3", inicio: "14:40", fim: "15:30", tipo: "aula", turno: "vespertino" },
  { id: "v4", inicio: "15:30", fim: "15:50", tipo: "intervalo", turno: "vespertino" },
  { id: "v5", inicio: "15:50", fim: "16:40", tipo: "aula", turno: "vespertino" },
  { id: "v6", inicio: "16:40", fim: "17:30", tipo: "aula", turno: "vespertino" },
  // Noturno — aulas mais curtas, turno mais enxuto
  { id: "n1", inicio: "19:00", fim: "19:45", tipo: "aula", turno: "noturno" },
  { id: "n2", inicio: "19:45", fim: "20:30", tipo: "aula", turno: "noturno" },
  { id: "n3", inicio: "20:30", fim: "20:45", tipo: "intervalo", turno: "noturno" },
  { id: "n4", inicio: "20:45", fim: "21:30", tipo: "aula", turno: "noturno" },
  { id: "n5", inicio: "21:30", fim: "22:15", tipo: "aula", turno: "noturno" },
  // Integral — manhã + almoço + tarde
  { id: "i1", inicio: "07:00", fim: "07:50", tipo: "aula", turno: "integral" },
  { id: "i2", inicio: "07:50", fim: "08:40", tipo: "aula", turno: "integral" },
  { id: "i3", inicio: "08:40", fim: "09:30", tipo: "aula", turno: "integral" },
  { id: "i4", inicio: "09:30", fim: "09:50", tipo: "intervalo", turno: "integral" },
  { id: "i5", inicio: "09:50", fim: "10:40", tipo: "aula", turno: "integral" },
  { id: "i6", inicio: "10:40", fim: "11:30", tipo: "aula", turno: "integral" },
  { id: "i7", inicio: "11:30", fim: "13:00", tipo: "intervalo", turno: "integral" },
  { id: "i8", inicio: "13:00", fim: "13:50", tipo: "aula", turno: "integral" },
  { id: "i9", inicio: "13:50", fim: "14:40", tipo: "aula", turno: "integral" },
  { id: "i10", inicio: "14:40", fim: "15:30", tipo: "aula", turno: "integral" },
  { id: "i11", inicio: "15:30", fim: "15:50", tipo: "intervalo", turno: "integral" },
  { id: "i12", inicio: "15:50", fim: "16:40", tipo: "aula", turno: "integral" },
]
