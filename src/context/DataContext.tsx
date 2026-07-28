import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { DISCIPLINAS, PROFESSORES, TURMAS_INICIAIS, type Disciplina, type Professor, type Turma } from "@/data/mockData"
import { useAuth } from "@/context/AuthContext"
import { getPlan, MVP_SEM_LIMITES } from "@/config/branding"

interface DataContextValue {
  turmas: Turma[]
  addTurma: (turma: Omit<Turma, "id">) => { ok: true } | { ok: false; error: string }
  removeTurma: (id: string) => void
  updateTurma: (turmaId: string, changes: Partial<Omit<Turma, "id">>) => void
  updateCargaHoraria: (turmaId: string, disciplinaId: string, quantidade: number) => void
  limiteAtingido: boolean
  maxTurmas: number | null
  professores: Professor[]
  setProfessores: (professores: Professor[]) => void
  disciplinas: Disciplina[]
  setDisciplinas: (disciplinas: Disciplina[]) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const storageKey = user ? `horaria_turmas_${user.id}` : null
  const professoresKey = user ? `horaria_professores_${user.id}` : null
  const disciplinasKey = user ? `horaria_disciplinas_${user.id}` : null

  // lazy init síncrono (não via effect) — evita um primeiro render com
  // turmas=[] pra usuários que já têm dados salvos, o que faria o wizard de
  // onboarding aparecer errado por uma fração de segundo antes de assentar.
  const [turmas, setTurmas] = useState<Turma[]>(() => {
    if (!storageKey) return []
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : TURMAS_INICIAIS
  })
  const [professores, setProfessoresState] = useState<Professor[]>(() => {
    if (!professoresKey) return []
    const saved = localStorage.getItem(professoresKey)
    return saved ? JSON.parse(saved) : PROFESSORES
  })
  const [disciplinas, setDisciplinasState] = useState<Disciplina[]>(() => {
    if (!disciplinasKey) return []
    const saved = localStorage.getItem(disciplinasKey)
    return saved ? JSON.parse(saved) : DISCIPLINAS
  })

  useEffect(() => {
    if (!storageKey) {
      setTurmas([])
      return
    }
    const saved = localStorage.getItem(storageKey)
    setTurmas(saved ? JSON.parse(saved) : TURMAS_INICIAIS)
  }, [storageKey])

  useEffect(() => {
    if (storageKey && turmas.length >= 0) {
      localStorage.setItem(storageKey, JSON.stringify(turmas))
    }
  }, [storageKey, turmas])

  useEffect(() => {
    if (!professoresKey) {
      setProfessoresState([])
      return
    }
    const saved = localStorage.getItem(professoresKey)
    setProfessoresState(saved ? JSON.parse(saved) : PROFESSORES)
  }, [professoresKey])

  useEffect(() => {
    if (professoresKey && professores.length >= 0) {
      localStorage.setItem(professoresKey, JSON.stringify(professores))
    }
  }, [professoresKey, professores])

  useEffect(() => {
    if (!disciplinasKey) {
      setDisciplinasState([])
      return
    }
    const saved = localStorage.getItem(disciplinasKey)
    setDisciplinasState(saved ? JSON.parse(saved) : DISCIPLINAS)
  }, [disciplinasKey])

  useEffect(() => {
    if (disciplinasKey && disciplinas.length >= 0) {
      localStorage.setItem(disciplinasKey, JSON.stringify(disciplinas))
    }
  }, [disciplinasKey, disciplinas])

  const maxTurmas = MVP_SEM_LIMITES ? null : user ? getPlan(user.plan).maxTurmas : null
  const limiteAtingido = maxTurmas !== null && turmas.length >= maxTurmas

  const addTurma: DataContextValue["addTurma"] = (turma) => {
    if (limiteAtingido) {
      return {
        ok: false,
        error: `Seu plano permite no máximo ${maxTurmas} turmas. Faça upgrade para adicionar mais.`,
      }
    }
    setTurmas((prev) => [...prev, { ...turma, id: `t-${Date.now()}-${prev.length}` }])
    return { ok: true }
  }

  const removeTurma = (id: string) => {
    setTurmas((prev) => prev.filter((t) => t.id !== id))
  }

  const updateTurma = (turmaId: string, changes: Partial<Omit<Turma, "id">>) => {
    setTurmas((prev) => prev.map((t) => (t.id === turmaId ? { ...t, ...changes } : t)))
  }

  const updateCargaHoraria = (turmaId: string, disciplinaId: string, quantidade: number) => {
    setTurmas((prev) =>
      prev.map((t) =>
        t.id === turmaId
          ? { ...t, cargaHoraria: { ...t.cargaHoraria, [disciplinaId]: Math.max(0, quantidade) } }
          : t,
      ),
    )
  }

  const setProfessores = (next: Professor[]) => setProfessoresState(next)
  const setDisciplinas = (next: Disciplina[]) => setDisciplinasState(next)

  const value = useMemo(
    () => ({
      turmas,
      addTurma,
      removeTurma,
      updateTurma,
      updateCargaHoraria,
      limiteAtingido,
      maxTurmas,
      professores,
      setProfessores,
      disciplinas,
      setDisciplinas,
    }),
    [turmas, limiteAtingido, maxTurmas, professores, disciplinas],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>")
  return ctx
}
