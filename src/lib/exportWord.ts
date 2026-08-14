import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import { APP_NAME } from "@/config/branding"
import { DIAS_SEMANA, type BlocoHorario, type Disciplina, type Professor, type Turma } from "@/data/mockData"
import type { GeneratedSchedule } from "@/lib/scheduleGenerator"
import { celulasDoProfessor, turnoPrincipalDoProfessor } from "@/lib/professorSchedule"

const PONTILHADO = "· · · · · · · ·"
const TRACEJADO = "－－－－－－－－－－－－"

/** clareia a cor da disciplina pra usar de fundo de célula — mesmo espírito do `${cor}1a` (alpha) usado no resto do app, só que .docx precisa de hex sólido, não rgba. */
function corClara(hex: string, quantidade = 0.82): string {
  const limpo = hex.replace("#", "")
  if (limpo.length !== 6) return "FFFFFF"
  const r = parseInt(limpo.slice(0, 2), 16)
  const g = parseInt(limpo.slice(2, 4), 16)
  const b = parseInt(limpo.slice(4, 6), 16)
  const clarear = (c: number) => Math.round(c + (255 - c) * quantidade)
  return [r, g, b]
    .map(clarear)
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

interface CelulaMascara {
  linhas: string[]
  corFundoHex?: string
}

function celulaTexto(paragrafos: string[], opts?: { negrito?: boolean; tamanho?: number; cor?: string }) {
  return paragrafos.map(
    (texto) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 20 },
        children: [new TextRun({ text: texto, bold: opts?.negrito, size: opts?.tamanho ?? 15, color: opts?.cor })],
      }),
  )
}

/**
 * Monta a grade Hor×dias de uma única pessoa/turma — mesmo formato "máscara"
 * usado pelo sistema de referência: linha tracejada nos intervalos, célula
 * pontilhada quando não há aula naquele horário, cor de fundo por disciplina.
 */
function construirTabelaSemana(blocosDoTurno: BlocoHorario[], celulaPara: (bloco: BlocoHorario, blocoIdx: number, diaIdx: number) => CelulaMascara | null): Table {
  const corCabecalho = "E2E8F0"
  const linhaCabecalho = new TableRow({
    tableHeader: true,
    children: ["Hor", ...DIAS_SEMANA].map(
      (h) =>
        new TableCell({
          width: { size: h === "Hor" ? 10 : 18, type: WidthType.PERCENTAGE },
          shading: { fill: corCabecalho, type: ShadingType.CLEAR },
          children: celulaTexto([h], { negrito: true, tamanho: 16 }),
        }),
    ),
  })

  const linhas = blocosDoTurno.map((bloco, blocoIdx) => {
    if (bloco.tipo === "intervalo") {
      return new TableRow({
        children: [
          new TableCell({ children: celulaTexto([""], { tamanho: 12 }) }),
          ...DIAS_SEMANA.map(() => new TableCell({ children: celulaTexto([TRACEJADO], { tamanho: 12, cor: "94A3B8" }) })),
        ],
      })
    }
    return new TableRow({
      children: [
        new TableCell({ children: celulaTexto([bloco.inicio], { negrito: true, tamanho: 14 }) }),
        ...DIAS_SEMANA.map((_, diaIdx) => {
          const cel = celulaPara(bloco, blocoIdx, diaIdx)
          return new TableCell({
            shading: cel?.corFundoHex ? { fill: cel.corFundoHex, type: ShadingType.CLEAR } : undefined,
            children: cel ? celulaTexto([cel.linhas[0], ...(cel.linhas[1] ? [cel.linhas[1]] : [])], { negrito: true, tamanho: 15 }) : celulaTexto([PONTILHADO], { tamanho: 13, cor: "CBD5E1" }),
          })
        }),
      ],
    })
  })

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [linhaCabecalho, ...linhas] })
}

function cabecalhoDocumento(titulo: string): Paragraph[] {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: APP_NAME, bold: true })] }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({ text: `${titulo} · gerado em ${new Date().toLocaleDateString("pt-BR")}`, size: 20, color: "64748B" }),
      ],
    }),
  ]
}

async function baixarDocx(doc: Document, nomeArquivo: string): Promise<void> {
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Máscara em Word, um quadro por professor (empilhados no mesmo documento,
 * igual ao modelo de referência) — turno "principal" de cada um (o que tem
 * mais aulas) define as linhas/intervalo; se ele der aula em outro turno
 * também, essas aulas ainda aparecem nas linhas cujo horário bater.
 */
export async function exportarWordProfessores(
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
): Promise<void> {
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))
  const turmaPorNome = new Map(turmas.map((t) => [t.nome, t]))
  const children: (Paragraph | Table)[] = cabecalhoDocumento("Horário dos professores")

  let algumProfessor = false
  for (const professor of professores) {
    const turno = turnoPrincipalDoProfessor(professor, turmas, schedule)
    if (!turno) continue // sem nenhuma aula na grade gerada
    algumProfessor = true

    const blocosDoTurno = blocos.filter((b) => b.turno === turno).sort((a, b) => a.inicio.localeCompare(b.inicio))
    const celulas = celulasDoProfessor(professor, turmas, schedule, blocos)

    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: professor.nome, bold: true })] }))
    children.push(
      construirTabelaSemana(blocosDoTurno, (bloco, _blocoIdx, diaIdx) => {
        const cel = celulas.get(`${DIAS_SEMANA[diaIdx]}-${bloco.inicio}`)
        if (!cel) return null
        const disciplina = disciplinaMap.get(cel.disciplinaId)
        const turmaCompleta = turmaPorNome.get(cel.turmaNome)
        const linha2 = [disciplina?.nomeAbreviado ?? disciplina?.nome ?? cel.disciplinaId, turmaCompleta?.sala ? `Sala ${turmaCompleta.sala}` : null]
          .filter(Boolean)
          .join(" · ")
        return { linhas: [cel.turmaNome, linha2], corFundoHex: disciplina ? corClara(disciplina.cor) : undefined }
      }),
    )
  }

  if (!algumProfessor) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Nenhum professor tem aula na grade gerada." })] }))
  }

  await baixarDocx(new Document({ sections: [{ children }] }), "horarios-professores.docx")
}

/** Máscara em Word, um quadro por turma (empilhados no mesmo documento). */
export async function exportarWordTurmas(
  turmas: Turma[],
  professores: Professor[],
  disciplinas: Disciplina[],
  blocos: BlocoHorario[],
  schedule: GeneratedSchedule,
): Promise<void> {
  const disciplinaMap = new Map(disciplinas.map((d) => [d.id, d]))
  const professorMap = new Map(professores.map((p) => [p.id, p.nome]))
  const children: (Paragraph | Table)[] = cabecalhoDocumento("Horário das turmas")

  for (const turma of turmas) {
    const blocosDaTurma = blocos.filter((b) => b.turno === turma.turno).sort((a, b) => a.inicio.localeCompare(b.inicio))
    const grade = schedule.grades[turma.id]

    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: turma.nome, bold: true })] }))
    children.push(
      construirTabelaSemana(blocosDaTurma, (_bloco, blocoIdx, diaIdx) => {
        const assignment = grade?.[diaIdx]?.[blocoIdx]
        if (!assignment) return null
        const disciplina = disciplinaMap.get(assignment.disciplinaId)
        const professorNome = professorMap.get(assignment.professorId) ?? ""
        return { linhas: [disciplina?.nome ?? assignment.disciplinaId, professorNome], corFundoHex: disciplina ? corClara(disciplina.cor) : undefined }
      }),
    )
  }

  if (turmas.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Nenhuma turma cadastrada." })] }))
  }

  await baixarDocx(new Document({ sections: [{ children }] }), "horarios-turmas.docx")
}
