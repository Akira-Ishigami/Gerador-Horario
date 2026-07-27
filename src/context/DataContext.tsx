import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { TURMAS_INICIAIS, type Turma } from "@/data/mockData"
import { useAuth } from "@/context/AuthContext"
import { getPlan } from "@/config/branding"

interface DataContextValue {
  turmas: Turma[]
  addTurma: (turma: Omit<Turma, "id">) => { ok: true } | { ok: false; error: string }
  removeTurma: (id: string) => void
  updateCargaHoraria: (turmaId: string, disciplinaId: string, quantidade: number) => void
  limiteAtingido: boolean
  maxTurmas: number | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const storageKey = user ? `horaria_turmas_${user.id}` : null
  const [turmas, setTurmas] = useState<Turma[]>([])

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

  const maxTurmas = user ? getPlan(user.plan).maxTurmas : null
  const limiteAtingido = maxTurmas !== null && turmas.length >= maxTurmas

  const addTurma: DataContextValue["addTurma"] = (turma) => {
    if (limiteAtingido) {
      return {
        ok: false,
        error: `Seu plano permite no máximo ${maxTurmas} turmas. Faça upgrade para adicionar mais.`,
      }
    }
    setTurmas((prev) => [...prev, { ...turma, id: `t-${Date.now()}` }])
    return { ok: true }
  }

  const removeTurma = (id: string) => {
    setTurmas((prev) => prev.filter((t) => t.id !== id))
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

  const value = useMemo(
    () => ({ turmas, addTurma, removeTurma, updateCargaHoraria, limiteAtingido, maxTurmas }),
    [turmas, limiteAtingido, maxTurmas],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData deve ser usado dentro de <DataProvider>")
  return ctx
}
