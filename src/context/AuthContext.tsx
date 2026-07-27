import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { MOCK_USERS, type MockUser } from "@/data/mockData"

interface AuthContextValue {
  user: MockUser | null
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

const STORAGE_KEY = "horaria_auth_user_id"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      const found = MOCK_USERS.find((u) => u.id === savedId)
      if (found) setUser(found)
    }
  }, [])

  const login = (email: string, password: string) => {
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!found) {
      return { ok: false as const, error: "E-mail ou senha inválidos." }
    }
    setUser(found)
    localStorage.setItem(STORAGE_KEY, found.id)
    return { ok: true as const }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
