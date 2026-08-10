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

export interface Professor {
  id: string
  nome: string
  disciplinaIds: string[]
  /** turmas em que pode dar aula; lista vazia = qualquer turma que precise da disciplina */
  turmaIds: string[]
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
}

export type Periodo = "matutino" | "vespertino" | "noturno" | "integral"

export const PERIODOS: Periodo[] = ["matutino", "vespertino", "noturno", "integral"]

export interface Turma {
  id: string
  nome: string
  turno: Periodo
  /** sala/ambiente onde a turma tem aula — só informativo, não afeta o gerador */
  sala?: string
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
