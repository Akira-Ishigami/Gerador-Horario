import ExcelJS from "exceljs"
import { DIAS_SEMANA, type BlocoHorario, type Disciplina, type Professor, type Turma } from "@/data/mockData"
import type { GeneratedSchedule } from "@/lib/scheduleGenerator"

const CABECALHO = ["Horário", ...DIAS_SEMANA]

function estilizarCabecalho(linha: ExcelJS.Row) {
  linha.font = { bold: true }
  linha.eachCell((celula) => {
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
    celula.alignment = { horizontal: "center", vertical: "middle" }
  })
}

function adicionarPlanilhaTurma(
  workbook: ExcelJS.Workbook,
  turma: Turma,
  blocosDaTurma: BlocoHorario[],
  grade: GeneratedSchedule["grades"][string] | undefined,
  professores: Professor[],
  disciplinas: Disciplina[],
) {
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d.nome]))
  const professorMap = new Map(professores.map((p) => [p.id, p.nome]))

  const sheet = workbook.addWorksheet(turma.nome.slice(0, 31))
  sheet.columns = [{ width: 14 }, ...DIAS_SEMANA.map(() => ({ width: 22 }))]
  estilizarCabecalho(sheet.addRow(CABECALHO))

  blocosDaTurma.forEach((bloco, blocoIdx) => {
    const horario = `${bloco.inicio}–${bloco.fim}`
    if (bloco.tipo === "intervalo") {
      const linha = sheet.addRow([horario, "Intervalo", "Intervalo", "Intervalo", "Intervalo", "Intervalo"])
      linha.eachCell((celula) => {
        celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
      })
      return
    }
    const valores = DIAS_SEMANA.map((_, diaIdx) => {
      const assignment = grade?.[diaIdx]?.[blocoIdx]
      if (!assignment) return ""
      const disciplina = disciplinaMap.get(assignment.disciplinaId) ?? assignment.disciplinaId
      const professor = professorMap.get(assignment.professorId) ?? ""
      return professor ? `${disciplina} - ${professor}` : disciplina
    })
    sheet.addRow([horario, ...valores])
  })
}

function adicionarPlanilhaProfessor(
  workbook: ExcelJS.Workbook,
  professor: Professor,
  turmas: Turma[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
  disciplinas: Disciplina[],
) {
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d.nome]))
  // célula[`${dia}-${horaInicio}`] = o que o professor dá naquele horário real,
  // juntando as turmas de turnos diferentes que ele der aula (mesma convenção
  // turno-agnóstica de horário usada no resto do gerador)
  const celulas = new Map<string, { turmaNome: string; disciplinaNome: string; fim: string }>()

  for (const turma of turmas) {
    const grade = schedule.grades[turma.id]
    if (!grade) continue
    const blocosDaTurma = blocos.filter((b) => b.turno === turma.turno)
    grade.forEach((linha, diaIdx) => {
      linha.forEach((assignment, blocoIdx) => {
        if (!assignment || assignment.professorId !== professor.id) return
        const bloco = blocosDaTurma[blocoIdx]
        if (!bloco) return
        const key = `${DIAS_SEMANA[diaIdx]}-${bloco.inicio}`
        celulas.set(key, {
          turmaNome: turma.nome,
          disciplinaNome: disciplinaMap.get(assignment.disciplinaId) ?? assignment.disciplinaId,
          fim: bloco.fim,
        })
      })
    })
  }

  if (celulas.size === 0) return // professor sem nenhuma aula na grade gerada — não cria planilha vazia

  const horarios = Array.from(
    new Set(Array.from(celulas.keys()).map((key) => key.split("-").slice(1).join("-"))),
  ).sort()

  const sheet = workbook.addWorksheet(professor.nome.slice(0, 31))
  sheet.columns = [{ width: 14 }, ...DIAS_SEMANA.map(() => ({ width: 22 }))]
  estilizarCabecalho(sheet.addRow(CABECALHO))

  for (const horario of horarios) {
    const valores = DIAS_SEMANA.map((dia) => {
      const cel = celulas.get(`${dia}-${horario}`)
      return cel ? `${cel.turmaNome}: ${cel.disciplinaNome}` : ""
    })
    const fim = DIAS_SEMANA.map((dia) => celulas.get(`${dia}-${horario}`)?.fim).find((f) => f)
    sheet.addRow([`${horario}–${fim ?? ""}`, ...valores])
  }
}

async function baixarWorkbook(workbook: ExcelJS.Workbook, nomeArquivo: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

function adicionarTodasTurmas(
  workbook: ExcelJS.Workbook,
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
) {
  for (const turma of turmas) {
    const blocosDaTurma = blocos.filter((b) => b.turno === turma.turno)
    adicionarPlanilhaTurma(workbook, turma, blocosDaTurma, schedule.grades[turma.id], professores, disciplinas)
  }
}

function adicionarTodosProfessores(
  workbook: ExcelJS.Workbook,
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
) {
  for (const professor of professores) {
    adicionarPlanilhaProfessor(workbook, professor, turmas, blocos, schedule, disciplinas)
  }
}

/** Um .xlsx só com a grade de cada turma (aba "Exportar" → "Exportar alunos"). */
export async function exportarExcelTurmas(
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  adicionarTodasTurmas(workbook, turmas, professores, disciplinas, blocos, schedule)
  await baixarWorkbook(workbook, "horarios-turmas.xlsx")
}

/** Um .xlsx só com a grade de cada professor (aba "Exportar" → "Exportar professores"). */
export async function exportarExcelProfessores(
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  adicionarTodosProfessores(workbook, turmas, professores, disciplinas, blocos, schedule)
  await baixarWorkbook(workbook, "horarios-professores.xlsx")
}

/** Um .xlsx com tudo: uma planilha por turma + uma por professor (aba "Exportar" → "Exportar todos"). */
export async function exportarExcelCompleto(
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  adicionarTodasTurmas(workbook, turmas, professores, disciplinas, blocos, schedule)
  adicionarTodosProfessores(workbook, turmas, professores, disciplinas, blocos, schedule)
  await baixarWorkbook(workbook, "horarios-completo.xlsx")
}
