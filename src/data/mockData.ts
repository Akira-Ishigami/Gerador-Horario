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
 * Usuários mock — sem backend. Login apenas confere email/senha nesta lista.
 * Credencial pedida pelo dono do projeto: akira.vha@gmail.com / akira123a (admin).
 */
export const MOCK_USERS: MockUser[] = [
  {
    id: "u-admin",
    name: "Akira",
    email: "akira.vha@gmail.com",
    password: "akira123a",
    role: "admin",
    plan: "ouro",
    avatarColor: "#6366f1",
  },
  {
    id: "u-coord",
    name: "Coordenação Demo",
    email: "coordenador@escola.com",
    password: "demo1234",
    role: "user",
    plan: "prata",
    avatarColor: "#0891b2",
  },
]

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
}

export const PROFESSORES: Professor[] = [
  { id: "p1", nome: "Ana Souza", disciplinaIds: ["mat"] },
  { id: "p2", nome: "Bruno Lima", disciplinaIds: ["port", "arte"] },
  { id: "p3", nome: "Carla Dias", disciplinaIds: ["cien"] },
  { id: "p4", nome: "Diego Alves", disciplinaIds: ["hist", "geo"] },
  { id: "p5", nome: "Elisa Nunes", disciplinaIds: ["ing"] },
  { id: "p6", nome: "Fábio Rocha", disciplinaIds: ["edf"] },
]

export type Periodo = "matutino" | "vespertino" | "noturno" | "integral"

export const PERIODOS: Periodo[] = ["matutino", "vespertino", "noturno", "integral"]

export interface Turma {
  id: string
  nome: string
  turno: Periodo
  /** quantidade de aulas semanais por disciplina */
  cargaHoraria: Record<string, number>
  /**
   * Dias da semana em que a turma tem aula. Capturado no wizard de
   * configuração, mas o gerador/grade ainda considera só Segunda a Sexta
   * (DIAS_SEMANA) — variar isso por turma é lógica pra uma próxima etapa.
   */
  diasFuncionamento: DiaSemana[]
}

export const TURMAS_INICIAIS: Turma[] = [
  {
    id: "t1",
    nome: "6º Ano A",
    turno: "matutino",
    cargaHoraria: { mat: 5, port: 5, cien: 3, hist: 2, geo: 2, ing: 2, edf: 2, arte: 1 },
    diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
  },
  {
    id: "t2",
    nome: "6º Ano B",
    turno: "matutino",
    cargaHoraria: { mat: 5, port: 5, cien: 3, hist: 2, geo: 2, ing: 2, edf: 2, arte: 1 },
    diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
  },
  {
    id: "t3",
    nome: "7º Ano A",
    turno: "vespertino",
    cargaHoraria: { mat: 4, port: 4, cien: 3, hist: 3, geo: 2, ing: 2, edf: 2, arte: 1 },
    diasFuncionamento: ["Seg", "Ter", "Qua", "Qui", "Sex"],
  },
]

/** Usado pelo gerador/grade — mantido em 5 dias por enquanto. */
export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const
/** Usado só no wizard de configuração (inclui Sábado). */
export const DIAS_SEMANA_COMPLETA = [...DIAS_SEMANA, "Sáb"] as const
export type DiaSemana = (typeof DIAS_SEMANA_COMPLETA)[number]

export const HORARIOS = ["07:00", "07:50", "08:40", "09:50", "10:40"] as const
