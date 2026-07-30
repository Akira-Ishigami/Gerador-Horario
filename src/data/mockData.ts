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
 * Configurável por conta (ver DataContext). Este é só o valor inicial pra
 * conta nova — já vem com um intervalo explícito no lugar do "buraco" que
 * existia entre 08:40 e 09:50. Só semeia o turno matutino; os demais turnos
 * partem vazios até o usuário configurar em Configurações.
 */
export const BLOCOS_HORARIOS_PADRAO: BlocoHorario[] = [
  { id: "h1", inicio: "07:00", fim: "07:50", tipo: "aula", turno: "matutino" },
  { id: "h2", inicio: "07:50", fim: "08:40", tipo: "aula", turno: "matutino" },
  { id: "h3", inicio: "08:40", fim: "09:30", tipo: "aula", turno: "matutino" },
  { id: "h4", inicio: "09:30", fim: "09:50", tipo: "intervalo", turno: "matutino" },
  { id: "h5", inicio: "09:50", fim: "10:40", tipo: "aula", turno: "matutino" },
  { id: "h6", inicio: "10:40", fim: "11:30", tipo: "aula", turno: "matutino" },
]
