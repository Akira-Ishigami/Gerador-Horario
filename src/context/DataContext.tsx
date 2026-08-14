import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  BLOCOS_HORARIOS_PADRAO,
  PERIODOS,
  gerarCodigoSecreto,
  type BlocoHorario,
  type Disciplina,
  type GrupoCoincidencia,
  type GrupoDisciplinas,
  type Professor,
  type Recurso,
  type Turma,
} from "@/data/mockData"
import {
  SEED_BLOCOS,
  SEED_DISCIPLINAS,
  SEED_GRUPOS_COINCIDENCIA,
  SEED_GRUPOS_DISCIPLINAS,
  SEED_PROFESSORES,
  SEED_RECURSOS,
  SEED_TURMAS,
} from "@/data/seedTeste"
import { useAuth } from "@/context/AuthContext"
import { getPlan, MODO_TESTE_LOCAL, MVP_SEM_LIMITES } from "@/config/branding"
import { supabase } from "@/lib/supabaseClient"

interface DataContextValue {
  /** true enquanto turmas/professores/disciplinas/blocos ainda estão sendo buscados do Supabase */
  loading: boolean
  turmas: Turma[]
  addTurma: (turma: Omit<Turma, "id">) => { ok: true; id: string } | { ok: false; error: string }
  removeTurma: (id: string) => void
  updateTurma: (turmaId: string, changes: Partial<Omit<Turma, "id">>) => void
  updateCargaHoraria: (turmaId: string, disciplinaId: string, quantidade: number) => void
  updateCargaHorariaGeminada: (turmaId: string, disciplinaId: string, geminada: boolean) => void
  limiteAtingido: boolean
  maxTurmas: number | null
  professores: Professor[]
  setProfessores: (professores: Professor[]) => void
  disciplinas: Disciplina[]
  setDisciplinas: (disciplinas: Disciplina[]) => void
  blocos: BlocoHorario[]
  setBlocos: (blocos: BlocoHorario[]) => void
  recursos: Recurso[]
  setRecursos: (recursos: Recurso[]) => void
  gruposCoincidencia: GrupoCoincidencia[]
  setGruposCoincidencia: (grupos: GrupoCoincidencia[]) => void
  gruposDisciplinas: GrupoDisciplinas[]
  setGruposDisciplinas: (grupos: GrupoDisciplinas[]) => void
}

const DataContext = createContext<DataContextValue | null>(null)

// --- mapeamento linha do banco (snake_case) <-> tipo do app (camelCase) ---

function turmaFromRow(row: any): Turma {
  return {
    id: row.id,
    nome: row.nome,
    turno: row.turno,
    sala: row.sala ?? undefined,
    aulasSemanais: row.aulas_semanais ?? undefined,
    minAulasPorDia: row.min_aulas_dia ?? undefined,
    maxAulasPorDia: row.max_aulas_dia ?? undefined,
    recreioDepoisDaAula: row.recreio_depois_da_aula ?? undefined,
    recreioDuracaoMin: row.recreio_duracao_min ?? undefined,
    codigoSecreto: row.codigo_secreto ?? undefined,
    cargaHoraria: row.carga_horaria ?? {},
    cargaHorariaGeminada: row.carga_horaria_geminada ?? {},
    diasFuncionamento: row.dias_funcionamento ?? [],
    aulasFixas: row.aulas_fixas ?? [],
  }
}
function turmaToRow(t: Turma, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    nome: t.nome,
    turno: t.turno,
    sala: t.sala ?? null,
    aulas_semanais: t.aulasSemanais ?? null,
    min_aulas_dia: t.minAulasPorDia ?? null,
    max_aulas_dia: t.maxAulasPorDia ?? null,
    recreio_depois_da_aula: t.recreioDepoisDaAula ?? null,
    recreio_duracao_min: t.recreioDuracaoMin ?? null,
    codigo_secreto: t.codigoSecreto ?? null,
    carga_horaria: t.cargaHoraria,
    carga_horaria_geminada: t.cargaHorariaGeminada,
    dias_funcionamento: t.diasFuncionamento,
    aulas_fixas: t.aulasFixas,
  }
}

// turmas_por_disciplina já existia (migration 0010) guardando só array de
// turmaIds por disciplina; agora cada entrada também carrega um `tipo`. Como
// é jsonb, não tem migration de coluna — só precisa converter na leitura pra
// não perder a restrição de turma que contas já tinham salvo no formato
// antigo (array puro em vez de {turmaIds, tipo}).
function turmasPorDisciplinaFromRow(raw: any): Professor["turmasPorDisciplina"] {
  const resultado: Professor["turmasPorDisciplina"] = {}
  for (const [disciplinaId, valor] of Object.entries(raw ?? {})) {
    if (Array.isArray(valor)) {
      resultado[disciplinaId] = { turmaIds: valor as string[], tipo: "A" }
    } else if (valor && typeof valor === "object") {
      const v = valor as { turmaIds?: string[]; tipo?: string; tipoPorTurma?: Record<string, string> }
      resultado[disciplinaId] = {
        turmaIds: v.turmaIds ?? [],
        tipo: (v.tipo as Professor["turmasPorDisciplina"][string]["tipo"]) ?? "A",
        tipoPorTurma: v.tipoPorTurma as Professor["turmasPorDisciplina"][string]["tipoPorTurma"],
      }
    }
  }
  return resultado
}

function professorFromRow(row: any): Professor {
  return {
    id: row.id,
    nome: row.nome,
    turmasPorDisciplina: turmasPorDisciplinaFromRow(row.turmas_por_disciplina),
    indisponibilidades: row.indisponibilidades ?? [],
    concentrarDias: row.concentrar_dias ?? false,
  }
}
function professorToRow(p: Professor, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    nome: p.nome,
    turmas_por_disciplina: p.turmasPorDisciplina,
    indisponibilidades: p.indisponibilidades,
    concentrar_dias: p.concentrarDias ?? false,
  }
}

function disciplinaFromRow(row: any): Disciplina {
  return {
    id: row.id,
    nome: row.nome,
    cor: row.cor,
    nomeAbreviado: row.nome_abreviado ?? undefined,
    tipo: row.tipo ?? undefined,
    horariosPermitidos: row.horarios_permitidos ?? undefined,
  }
}
function disciplinaToRow(d: Disciplina, userId: string) {
  return {
    id: d.id,
    user_id: userId,
    nome: d.nome,
    cor: d.cor,
    nome_abreviado: d.nomeAbreviado ?? null,
    tipo: d.tipo ?? null,
    horarios_permitidos: d.horariosPermitidos ?? [],
  }
}

function blocoFromRow(row: any): BlocoHorario {
  return { id: row.id, inicio: row.inicio, fim: row.fim, tipo: row.tipo, turno: row.turno ?? "matutino" }
}
function blocoToRow(b: BlocoHorario, userId: string) {
  return { id: b.id, user_id: userId, inicio: b.inicio, fim: b.fim, tipo: b.tipo, turno: b.turno }
}

function recursoFromRow(row: any): Recurso {
  return { id: row.id, nome: row.nome, quantidade: row.quantidade, disciplinaIds: row.disciplina_ids ?? [] }
}
function recursoToRow(r: Recurso, userId: string) {
  return { id: r.id, user_id: userId, nome: r.nome, quantidade: r.quantidade, disciplina_ids: r.disciplinaIds }
}

function grupoCoincidenciaFromRow(row: any): GrupoCoincidencia {
  return { id: row.id, nome: row.nome, disciplinaId: row.disciplina_id, turmaIds: row.turma_ids ?? [] }
}
function grupoCoincidenciaToRow(g: GrupoCoincidencia, userId: string) {
  return { id: g.id, user_id: userId, nome: g.nome, disciplina_id: g.disciplinaId, turma_ids: g.turmaIds }
}

function grupoDisciplinasFromRow(row: any): GrupoDisciplinas {
  return { id: row.id, nome: row.nome, disciplinaIds: row.disciplina_ids ?? [], maxPorDia: row.max_por_dia }
}
function grupoDisciplinasToRow(g: GrupoDisciplinas, userId: string) {
  return { id: g.id, user_id: userId, nome: g.nome, disciplina_ids: g.disciplinaIds, max_por_dia: g.maxPorDia }
}

/**
 * `setX(novaLista)` substitui a lista inteira do lado do app (padrão usado
 * pelos Managers). Aqui a gente descobre o que mudou comparando com a lista
 * anterior e sincroniza só a diferença com o Supabase (upsert dos que
 * ficaram, delete dos que sumiram) — fire-and-forget, não bloqueia a UI.
 */
async function syncTable<T extends { id: string }>(
  table: string,
  userId: string,
  prev: T[],
  next: T[],
  toRow: (item: T, userId: string) => Record<string, unknown>,
) {
  const nextIds = new Set(next.map((i) => i.id))
  const removidos = prev.filter((i) => !nextIds.has(i.id)).map((i) => i.id)
  if (removidos.length > 0) {
    await supabase.from(table).delete().eq("user_id", userId).in("id", removidos)
  }
  if (next.length > 0) {
    await supabase.from(table).upsert(next.map((item) => toRow(item, userId)))
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [professores, setProfessoresState] = useState<Professor[]>([])
  const [disciplinas, setDisciplinasState] = useState<Disciplina[]>([])
  const [blocos, setBlocosState] = useState<BlocoHorario[]>([])
  const [recursos, setRecursosState] = useState<Recurso[]>([])
  const [gruposCoincidencia, setGruposCoincidenciaState] = useState<GrupoCoincidencia[]>([])
  const [gruposDisciplinas, setGruposDisciplinasState] = useState<GrupoDisciplinas[]>([])

  useEffect(() => {
    if (MODO_TESTE_LOCAL) {
      setTurmas(SEED_TURMAS)
      setProfessoresState(SEED_PROFESSORES)
      setDisciplinasState(SEED_DISCIPLINAS)
      setBlocosState(SEED_BLOCOS)
      setRecursosState(SEED_RECURSOS)
      setGruposCoincidenciaState(SEED_GRUPOS_COINCIDENCIA)
      setGruposDisciplinasState(SEED_GRUPOS_DISCIPLINAS)
      setLoading(false)
      return
    }

    if (!user) {
      setTurmas([])
      setProfessoresState([])
      setDisciplinasState([])
      setBlocosState([])
      setRecursosState([])
      setGruposCoincidenciaState([])
      setGruposDisciplinasState([])
      setLoading(false)
      return
    }

    let cancelado = false
    setLoading(true)

    ;(async () => {
      const [turmasRes, professoresRes, disciplinasRes, blocosRes, recursosRes, gruposRes, gruposDisciplinasRes] = await Promise.all([
        supabase.from("turmas").select("*").eq("user_id", user.id),
        supabase.from("professores").select("*").eq("user_id", user.id),
        supabase.from("disciplinas").select("*").eq("user_id", user.id),
        supabase.from("blocos_horarios").select("*").eq("user_id", user.id),
        supabase.from("recursos").select("*").eq("user_id", user.id),
        supabase.from("grupos_coincidencia").select("*").eq("user_id", user.id),
        supabase.from("grupos_disciplinas").select("*").eq("user_id", user.id),
      ])
      if (cancelado) return

      setTurmas((turmasRes.data ?? []).map(turmaFromRow))
      setProfessoresState((professoresRes.data ?? []).map(professorFromRow))
      setDisciplinasState((disciplinasRes.data ?? []).map(disciplinaFromRow))
      setRecursosState((recursosRes.data ?? []).map(recursoFromRow))
      setGruposCoincidenciaState((gruposRes.data ?? []).map(grupoCoincidenciaFromRow))
      setGruposDisciplinasState((gruposDisciplinasRes.data ?? []).map(grupoDisciplinasFromRow))

      const blocosCarregados = (blocosRes.data ?? []).map(blocoFromRow)
      const turnosExistentes = new Set(blocosCarregados.map((b) => b.turno))
      const turnosFaltando = PERIODOS.filter((p) => !turnosExistentes.has(p))
      if (turnosFaltando.length > 0) {
        // conta nova (todos os turnos faltando) ou conta que já configurou
        // só alguns turnos — completa com o padrão só o que ainda falta e
        // já salva pro banco.
        const blocosParaSemear = BLOCOS_HORARIOS_PADRAO.filter((b) => turnosFaltando.includes(b.turno))
        setBlocosState([...blocosCarregados, ...blocosParaSemear])
        supabase
          .from("blocos_horarios")
          .upsert(blocosParaSemear.map((b) => blocoToRow(b, user.id)))
          .then(({ error }) => {
            if (error) console.error("Erro ao semear horários padrão:", error)
          })
      } else {
        setBlocosState(blocosCarregados)
      }

      setLoading(false)
    })()

    return () => {
      cancelado = true
    }
    // depende só do id (não do objeto `user` inteiro): o AuthContext recria esse
    // objeto a cada evento do onAuthStateChange (ex: refresh de token), mesmo
    // sem trocar de usuário — se o efeito rodasse de novo nesses casos, ele
    // re-buscaria e sobrescreveria qualquer turma/professor recém-criado que
    // ainda não tivesse sido persistido, perdendo a edição do usuário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const maxTurmas = MVP_SEM_LIMITES ? null : user ? getPlan(user.plan).maxTurmas : null
  const limiteAtingido = maxTurmas !== null && turmas.length >= maxTurmas

  const addTurma: DataContextValue["addTurma"] = (turma) => {
    if (limiteAtingido) {
      return {
        ok: false,
        error: `Seu plano permite no máximo ${maxTurmas} turmas. Faça upgrade para adicionar mais.`,
      }
    }
    if (!user && !MODO_TESTE_LOCAL) return { ok: false, error: "Você precisa estar logado." }

    // Math.random() além do timestamp: addTurma roda várias vezes seguidas
    // (num forEach síncrono) quando o wizard de onboarding cria várias turmas
    // de uma vez — só o timestamp colidia e causava ids duplicados (a 2ª
    // turma em diante falhava ao inserir, violação de chave primária).
    const nova: Turma = {
      ...turma,
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      codigoSecreto: turma.codigoSecreto ?? gerarCodigoSecreto(),
    }
    setTurmas((prev) => [...prev, nova])
    // .insert(...) só dispara a requisição de verdade quando "then"-ado ou
    // aguardado — o client do Supabase é lazy (thenable), então um `void`
    // sozinho na frente não bastava e a chamada nunca ia pra rede.
    if (!MODO_TESTE_LOCAL && user) {
      supabase
        .from("turmas")
        .insert(turmaToRow(nova, user.id))
        .then(({ error }) => {
          if (error) console.error("Erro ao salvar turma:", error)
        })
    }
    return { ok: true, id: nova.id }
  }

  const removeTurma = (id: string) => {
    setTurmas((prev) => prev.filter((t) => t.id !== id))
    if (!user || MODO_TESTE_LOCAL) return
    supabase
      .from("turmas")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Erro ao remover turma:", error)
      })
  }

  const updateTurma = (turmaId: string, changes: Partial<Omit<Turma, "id">>) => {
    // mesmo motivo do updateCargaHoraria: computa dentro do updater (não a
    // partir de `turmas` do fechamento) pra ficar seguro mesmo se um dia
    // isso for chamado várias vezes seguidas pra mesma turma num só clique.
    let atualizado: Turma | null = null
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t
        atualizado = { ...t, ...changes }
        return atualizado
      }),
    )
    if (!user || !atualizado || MODO_TESTE_LOCAL) return
    supabase
      .from("turmas")
      .update(turmaToRow(atualizado, user.id))
      .eq("user_id", user.id)
      .eq("id", turmaId)
      .then(({ error }) => {
        if (error) console.error("Erro ao atualizar turma:", error)
      })
  }

  const updateCargaHoraria = (turmaId: string, disciplinaId: string, quantidade: number) => {
    // novaCarga é computado dentro do updater (a partir do `prev` mais
    // recente, não de `turmas` do fechamento) porque isso pode ser chamado
    // várias vezes seguidas pra mesma turma no mesmo clique (ex: "Aplicar a
    // todas as turmas", uma chamada por matéria) — usar `turmas` do
    // fechamento faria cada chamada sobrescrever a carga horária inteira só
    // com a matéria da vez, perdendo as anteriores do mesmo clique.
    let novaCarga: Record<string, number> | null = null
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t
        novaCarga = { ...t.cargaHoraria, [disciplinaId]: Math.max(0, quantidade) }
        return { ...t, cargaHoraria: novaCarga }
      }),
    )
    if (!user || !novaCarga || MODO_TESTE_LOCAL) return
    supabase
      .from("turmas")
      .update({ carga_horaria: novaCarga })
      .eq("user_id", user.id)
      .eq("id", turmaId)
      .then(({ error }) => {
        if (error) console.error("Erro ao atualizar carga horária:", error)
      })
  }

  const updateCargaHorariaGeminada = (turmaId: string, disciplinaId: string, geminada: boolean) => {
    // mesmo motivo do updateCargaHoraria: computa dentro do updater, não do
    // fechamento — o modo "Todos" chama isso uma vez por turma no mesmo clique.
    let novaGeminada: Record<string, boolean> | null = null
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t
        novaGeminada = { ...t.cargaHorariaGeminada, [disciplinaId]: geminada }
        return { ...t, cargaHorariaGeminada: novaGeminada }
      }),
    )
    if (!user || !novaGeminada || MODO_TESTE_LOCAL) return
    supabase
      .from("turmas")
      .update({ carga_horaria_geminada: novaGeminada })
      .eq("user_id", user.id)
      .eq("id", turmaId)
      .then(({ error }) => {
        if (error) console.error("Erro ao atualizar aula geminada:", error)
      })
  }

  const setProfessores = (next: Professor[]) => {
    const prev = professores
    setProfessoresState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("professores", user.id, prev, next, professorToRow)
  }

  const setDisciplinas = (next: Disciplina[]) => {
    const prev = disciplinas
    setDisciplinasState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("disciplinas", user.id, prev, next, disciplinaToRow)
  }

  const setBlocos = (next: BlocoHorario[]) => {
    const prev = blocos
    setBlocosState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("blocos_horarios", user.id, prev, next, blocoToRow)
  }

  const setRecursos = (next: Recurso[]) => {
    const prev = recursos
    setRecursosState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("recursos", user.id, prev, next, recursoToRow)
  }

  const setGruposCoincidencia = (next: GrupoCoincidencia[]) => {
    const prev = gruposCoincidencia
    setGruposCoincidenciaState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("grupos_coincidencia", user.id, prev, next, grupoCoincidenciaToRow)
  }

  const setGruposDisciplinas = (next: GrupoDisciplinas[]) => {
    const prev = gruposDisciplinas
    setGruposDisciplinasState(next)
    if (user && !MODO_TESTE_LOCAL) void syncTable("grupos_disciplinas", user.id, prev, next, grupoDisciplinasToRow)
  }

  const value = useMemo(
    () => ({
      loading,
      turmas,
      addTurma,
      removeTurma,
      updateTurma,
      updateCargaHoraria,
      updateCargaHorariaGeminada,
      limiteAtingido,
      maxTurmas,
      professores,
      setProfessores,
      disciplinas,
      setDisciplinas,
      blocos,
      setBlocos,
      recursos,
      setRecursos,
      gruposCoincidencia,
      setGruposCoincidencia,
      gruposDisciplinas,
      setGruposDisciplinas,
    }),
    [loading, turmas, limiteAtingido, maxTurmas, professores, disciplinas, blocos, recursos, gruposCoincidencia, gruposDisciplinas],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>")
  return ctx
}
