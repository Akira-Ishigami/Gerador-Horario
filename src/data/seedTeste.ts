import {
  gerarCodigoSecreto,
  type BlocoHorario,
  type DiaSemana,
  type Disciplina,
  type GrupoCoincidencia,
  type GrupoDisciplinas,
  type Professor,
  type Recurso,
  type Turma,
} from "./mockData"

/**
 * Dados de exemplo pro modo de teste local (ver `MODO_TESTE_LOCAL` em
 * branding.ts) — 15 turmas em tempo integral (fundamental + médio), aula de
 * 45min, com professores cobrindo todas as disciplinas, incluindo um caso de
 * restrição por turma ("Trilha" só pros 8º anos, mesmo professor que dá
 * Educação Física pra várias turmas) pra exercitar a tela de Professores.
 */

const DIAS: DiaSemana[] = ["Seg", "Ter", "Qua", "Qui", "Sex"]

export const SEED_DISCIPLINAS: Disciplina[] = [
  { id: "mat", nome: "Matemática", cor: "#6366f1", nomeAbreviado: "MAT", tipo: "Regular" },
  { id: "port", nome: "Português", cor: "#ec4899", nomeAbreviado: "POR", tipo: "Regular" },
  { id: "cien", nome: "Ciências", cor: "#22c55e", nomeAbreviado: "CIE", tipo: "Regular" },
  { id: "hist", nome: "História", cor: "#f59e0b", nomeAbreviado: "HIS", tipo: "Regular" },
  { id: "geo", nome: "Geografia", cor: "#06b6d4", nomeAbreviado: "GEO", tipo: "Regular" },
  { id: "ing", nome: "Inglês", cor: "#a855f7", nomeAbreviado: "ING", tipo: "Regular" },
  { id: "edf", nome: "Educação Física", cor: "#ef4444", nomeAbreviado: "EDF", tipo: "Regular" },
  { id: "arte", nome: "Artes", cor: "#eab308", nomeAbreviado: "ART", tipo: "Regular" },
  { id: "trilha", nome: "Trilha", cor: "#14b8a6", nomeAbreviado: "TRI", tipo: "Eletiva" },
]

// Sem disciplina vinculada de propósito: a carga horária do seed já foi
// calibrada à mão (ver comentário mais abaixo) pra não sobrar conflito, e
// vincular um recurso aqui poderia quebrar isso. Servem só pra mostrar a
// tela de Recursos com dados de exemplo — vincular fica por conta de quem
// testar.
export const SEED_RECURSOS: Recurso[] = [
  { id: "seed-r-lab", nome: "Laboratório de Informática", quantidade: 2, disciplinaIds: [] },
  { id: "seed-r-quadra", nome: "Quadra poliesportiva", quantidade: 1, disciplinaIds: [] },
]

// Vazio pelo mesmo motivo de SEED_RECURSOS: coordenar turmas pra caírem
// juntas é uma restrição a mais sobre uma grade já calibrada à mão — deixa
// pra quem for testar montar um grupo e ver o efeito.
export const SEED_GRUPOS_COINCIDENCIA: GrupoCoincidencia[] = []

// Idem: um cap de aulas/dia por grupo de disciplinas é mais uma restrição
// sobre a grade já calibrada à mão — vazio de propósito.
export const SEED_GRUPOS_DISCIPLINAS: GrupoDisciplinas[] = []

/**
 * Turno único (integral), aula de 45min — 9 aulas/dia (5 de manhã, 4 de
 * tarde) com intervalo de 20min de manhã/tarde e almoço de 90min. Só usado
 * no modo de teste local (não mexe no padrão real em `BLOCOS_HORARIOS_PADRAO`
 * de `mockData.ts`, que continua servindo pra contas novas de verdade).
 */
export const SEED_BLOCOS: BlocoHorario[] = [
  { id: "si1", inicio: "07:00", fim: "07:45", tipo: "aula", turno: "integral" },
  { id: "si2", inicio: "07:45", fim: "08:30", tipo: "aula", turno: "integral" },
  { id: "si3", inicio: "08:30", fim: "09:15", tipo: "aula", turno: "integral" },
  { id: "si4", inicio: "09:15", fim: "09:35", tipo: "intervalo", turno: "integral" },
  { id: "si5", inicio: "09:35", fim: "10:20", tipo: "aula", turno: "integral" },
  { id: "si6", inicio: "10:20", fim: "11:05", tipo: "aula", turno: "integral" },
  { id: "si7", inicio: "11:05", fim: "12:35", tipo: "intervalo", turno: "integral" }, // almoço
  { id: "si8", inicio: "12:35", fim: "13:20", tipo: "aula", turno: "integral" },
  { id: "si9", inicio: "13:20", fim: "14:05", tipo: "aula", turno: "integral" },
  { id: "si10", inicio: "14:05", fim: "14:50", tipo: "aula", turno: "integral" },
  { id: "si11", inicio: "14:50", fim: "15:10", tipo: "intervalo", turno: "integral" },
  { id: "si12", inicio: "15:10", fim: "15:55", tipo: "aula", turno: "integral" },
]

// 9 aulas/dia x 5 dias = 45 vagas/semana por professor nesse turno único —
// os números abaixo (e os agrupamentos de turma mais abaixo) foram testados
// à mão (script de simulação, 20 rodadas) pra não sobrar conflito.
const CARGA_PADRAO: Record<string, number> = {
  mat: 5,
  port: 5,
  cien: 3,
  hist: 3,
  geo: 3,
  ing: 3,
  edf: 3,
  arte: 2,
}

const FUND_A = ["6a", "6b", "6c", "7a", "7b", "7c"]
const FUND_B = ["8a", "8b", "9a", "9b"]
const MEDIO = ["1a", "1b", "2a", "2b", "3a"]

function turmaId(sufixo: string) {
  return `seed-t-${sufixo}`
}

function criarTurma(sufixo: string, nome: string, sala: string, extra?: Record<string, number>): Turma {
  const cargaHoraria = { ...CARGA_PADRAO, ...extra }
  return {
    id: turmaId(sufixo),
    nome,
    turno: "integral",
    sala,
    aulasSemanais: Object.values(cargaHoraria).reduce((soma, n) => soma + n, 0),
    minAulasPorDia: 4,
    maxAulasPorDia: 7,
    cargaHoraria,
    cargaHorariaGeminada: {},
    diasFuncionamento: DIAS,
    aulasFixas: [],
    codigoSecreto: gerarCodigoSecreto(),
  }
}

export const SEED_TURMAS: Turma[] = [
  criarTurma("6a", "6º A", "Sala 01"),
  criarTurma("6b", "6º B", "Sala 02"),
  criarTurma("6c", "6º C", "Sala 03"),
  criarTurma("7a", "7º A", "Sala 04"),
  criarTurma("7b", "7º B", "Sala 05"),
  criarTurma("7c", "7º C", "Sala 06"),
  criarTurma("8a", "8º A", "Sala 07", { trilha: 2 }),
  criarTurma("8b", "8º B", "Sala 08", { trilha: 2 }),
  criarTurma("9a", "9º A", "Sala 09"),
  criarTurma("9b", "9º B", "Sala 10"),
  criarTurma("1a", "1º A", "Sala 11"),
  criarTurma("1b", "1º B", "Sala 12"),
  criarTurma("2a", "2º A", "Sala 13"),
  criarTurma("2b", "2º B", "Sala 14"),
  criarTurma("3a", "3º A", "Sala 15"),
]

function ids(sufixos: string[]) {
  return sufixos.map(turmaId)
}

type ConfigDisciplina = Professor["turmasPorDisciplina"][string]

function criarProfessor(
  sufixo: string,
  nome: string,
  materias: Record<string, ConfigDisciplina>,
  indisponibilidades: Professor["indisponibilidades"] = [],
): Professor {
  return { id: `seed-p-${sufixo}`, nome, turmasPorDisciplina: materias, indisponibilidades }
}

// Como agora é um turno só (integral), todas as turmas competem pela mesma
// agenda de 45 vagas/semana de cada professor — por isso cada disciplina é
// dividida em 3 grupos de turma (em vez de 1 professor pra escola toda),
// senão o gerador esbarra em gargalo de agenda mesmo com carga baixa.
export const SEED_PROFESSORES: Professor[] = [
  criarProfessor("1", "Ana Souza", { mat: { turmaIds: ids(FUND_A), tipo: "A" } }, [{ dia: "Sex", horario: "15:10" }]),
  criarProfessor("2", "Bruno Lima", { mat: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("3", "Carla Mendes", { mat: { turmaIds: ids(MEDIO), tipo: "A" } }, [{ dia: "Seg", horario: "07:00" }]),
  criarProfessor("4", "Diego Alves", { port: { turmaIds: ids(FUND_A), tipo: "A" } }),
  criarProfessor("5", "Elaine Rocha", { port: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("6", "Fábio Nunes", { port: { turmaIds: ids(MEDIO), tipo: "A" } }),
  criarProfessor("7", "Giovana Reis", { cien: { turmaIds: ids(FUND_A), tipo: "G" } }),
  criarProfessor("8", "Igor Barbosa", { cien: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("9", "Hugo Teixeira", { cien: { turmaIds: ids(MEDIO), tipo: "A" } }),
  criarProfessor("10", "Isabela Cruz", { hist: { turmaIds: ids(FUND_A), tipo: "A" } }),
  criarProfessor("11", "Julia Prado", { hist: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("12", "Hugo Teixeira Jr.", { hist: { turmaIds: ids(MEDIO), tipo: "A" } }),
  criarProfessor("13", "João Pedro Farias", { geo: { turmaIds: ids(FUND_A), tipo: "A" } }),
  criarProfessor("14", "Larissa Gomes", { geo: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("15", "Natália Ramos", { geo: { turmaIds: ids(MEDIO), tipo: "A" } }),
  criarProfessor("16", "Karina Dias", { ing: { turmaIds: ids(FUND_A), tipo: "A" } }),
  criarProfessor("17", "Otávio Martins", { ing: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("18", "Beatriz Prado", { ing: { turmaIds: ids(MEDIO), tipo: "A" } }),
  criarProfessor("19", "Leonardo Castro", { edf: { turmaIds: ids(FUND_A), tipo: "G" } }),
  criarProfessor("20", "Pedro Kishi", {
    edf: { turmaIds: ids(FUND_B), tipo: "G" },
    trilha: { turmaIds: ids(["8a", "8b"]), tipo: "H" },
  }),
  criarProfessor("21", "Rafael Souza", { edf: { turmaIds: ids(MEDIO), tipo: "G" } }),
  criarProfessor("22", "Marina Alves", { arte: { turmaIds: ids(FUND_A), tipo: "A" } }),
  criarProfessor("23", "Sofia Bittencourt", { arte: { turmaIds: ids(FUND_B), tipo: "A" } }),
  criarProfessor("24", "Tiago Ferreira", { arte: { turmaIds: ids(MEDIO), tipo: "A" } }),
]
