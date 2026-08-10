import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { BLOCOS_HORARIOS_PADRAO, PERIODOS, type BlocoHorario, type Disciplina, type Professor, type Turma } from "@/data/mockData"
import { useAuth } from "@/context/AuthContext"
import { getPlan, MVP_SEM_LIMITES } from "@/config/branding"
import { supabase } from "@/lib/supabaseClient"

interface DataContextValue {
  /** true enquanto turmas/professores/disciplinas/blocos ainda estão sendo buscados do Supabase */
  loading: boolean
  turmas: Turma[]
  addTurma: (turma: Omit<Turma, "id">) => { ok: true } | { ok: false; error: string }
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
}

const DataContext = createContext<DataContextValue | null>(null)

// --- mapeamento linha do banco (snake_case) <-> tipo do app (camelCase) ---

function turmaFromRow(row: any): Turma {
  return {
    id: row.id,
    nome: row.nome,
    turno: row.turno,
    sala: row.sala ?? undefined,
    cargaHoraria: row.carga_horaria ?? {},
    cargaHorariaGeminada: row.carga_horaria_geminada ?? {},
    diasFuncionamento: row.dias_funcionamento ?? [],
  }
}
function turmaToRow(t: Turma, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    nome: t.nome,
    turno: t.turno,
    sala: t.sala ?? null,
    carga_horaria: t.cargaHoraria,
    carga_horaria_geminada: t.cargaHorariaGeminada,
    dias_funcionamento: t.diasFuncionamento,
  }
}

function professorFromRow(row: any): Professor {
  return {
    id: row.id,
    nome: row.nome,
    turmasPorDisciplina: row.turmas_por_disciplina ?? {},
    indisponibilidades: row.indisponibilidades ?? [],
  }
}
function professorToRow(p: Professor, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    nome: p.nome,
    turmas_por_disciplina: p.turmasPorDisciplina,
    indisponibilidades: p.indisponibilidades,
  }
}

function disciplinaFromRow(row: any): Disciplina {
  return { id: row.id, nome: row.nome, cor: row.cor }
}
function disciplinaToRow(d: Disciplina, userId: string) {
  return { id: d.id, user_id: userId, nome: d.nome, cor: d.cor }
}

function blocoFromRow(row: any): BlocoHorario {
  return { id: row.id, inicio: row.inicio, fim: row.fim, tipo: row.tipo, turno: row.turno ?? "matutino" }
}
function blocoToRow(b: BlocoHorario, userId: string) {
  return { id: b.id, user_id: userId, inicio: b.inicio, fim: b.fim, tipo: b.tipo, turno: b.turno }
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

  useEffect(() => {
    if (!user) {
      setTurmas([])
      setProfessoresState([])
      setDisciplinasState([])
      setBlocosState([])
      setLoading(false)
      return
    }

    let cancelado = false
    setLoading(true)

    ;(async () => {
      const [turmasRes, professoresRes, disciplinasRes, blocosRes] = await Promise.all([
        supabase.from("turmas").select("*").eq("user_id", user.id),
        supabase.from("professores").select("*").eq("user_id", user.id),
        supabase.from("disciplinas").select("*").eq("user_id", user.id),
        supabase.from("blocos_horarios").select("*").eq("user_id", user.id),
      ])
      if (cancelado) return

      setTurmas((turmasRes.data ?? []).map(turmaFromRow))
      setProfessoresState((professoresRes.data ?? []).map(professorFromRow))
      setDisciplinasState((disciplinasRes.data ?? []).map(disciplinaFromRow))

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
    if (!user) return { ok: false, error: "Você precisa estar logado." }

    // Math.random() além do timestamp: addTurma roda várias vezes seguidas
    // (num forEach síncrono) quando o wizard de onboarding cria várias turmas
    // de uma vez — só o timestamp colidia e causava ids duplicados (a 2ª
    // turma em diante falhava ao inserir, violação de chave primária).
    const nova: Turma = { ...turma, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
    setTurmas((prev) => [...prev, nova])
    // .insert(...) só dispara a requisição de verdade quando "then"-ado ou
    // aguardado — o client do Supabase é lazy (thenable), então um `void`
    // sozinho na frente não bastava e a chamada nunca ia pra rede.
    supabase
      .from("turmas")
      .insert(turmaToRow(nova, user.id))
      .then(({ error }) => {
        if (error) console.error("Erro ao salvar turma:", error)
      })
    return { ok: true }
  }

  const removeTurma = (id: string) => {
    setTurmas((prev) => prev.filter((t) => t.id !== id))
    if (!user) return
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
    if (!user || !atualizado) return
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
    if (!user || !novaCarga) return
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
    if (!user || !novaGeminada) return
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
    if (user) void syncTable("professores", user.id, prev, next, professorToRow)
  }

  const setDisciplinas = (next: Disciplina[]) => {
    const prev = disciplinas
    setDisciplinasState(next)
    if (user) void syncTable("disciplinas", user.id, prev, next, disciplinaToRow)
  }

  const setBlocos = (next: BlocoHorario[]) => {
    const prev = blocos
    setBlocosState(next)
    if (user) void syncTable("blocos_horarios", user.id, prev, next, blocoToRow)
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
    }),
    [loading, turmas, limiteAtingido, maxTurmas, professores, disciplinas, blocos],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>")
  return ctx
}
