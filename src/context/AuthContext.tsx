import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { MOCK_USERS, type MockUser } from "@/data/mockData"

interface AuthContextValue {
  user: MockUser | null
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  signup: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

const STORAGE_KEY = "horaria_auth_user_id"
const SIGNUP_USERS_KEY = "horaria_signup_users"

function loadSignupUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(SIGNUP_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signupUsers, setSignupUsers] = useState<MockUser[]>(loadSignupUsers)
  // restaura a sessão de forma síncrona (não via effect) — evita um primeiro
  // render com user=null que faria telas dependentes (ex: wizard de
  // onboarding por turmas.length === 0) piscarem errado antes de assentar.
  const [user, setUser] = useState<MockUser | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (!savedId) return null
    return [...MOCK_USERS, ...signupUsers].find((u) => u.id === savedId) ?? null
  })

  const allUsers = useMemo(() => [...MOCK_USERS, ...signupUsers], [signupUsers])

  const login = (email: string, password: string) => {
    const found = allUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!found) {
      return { ok: false as const, error: "E-mail ou senha inválidos." }
    }
    setUser(found)
    localStorage.setItem(STORAGE_KEY, found.id)
    return { ok: true as const }
  }

  const signup: AuthContextValue["signup"] = (name, email, password) => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail || !password) {
      return { ok: false as const, error: "Preencha nome, e-mail e senha." }
    }
    if (allUsers.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { ok: false as const, error: "Já existe uma conta com esse e-mail." }
    }

    const newUser: MockUser = {
      id: `u-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: "user",
      plan: "teste",
      avatarColor: "#6366f1",
    }

    const updated = [...signupUsers, newUser]
    setSignupUsers(updated)
    localStorage.setItem(SIGNUP_USERS_KEY, JSON.stringify(updated))
    // conta nova no plano Teste (1 turma) começa vazia — sem isso, DataContext
    // cairia no fallback de turmas mock e já nasceria acima do limite do plano.
    localStorage.setItem(`horaria_turmas_${newUser.id}`, JSON.stringify([]))

    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, newUser.id)
    return { ok: true as const }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(() => ({ user, login, signup, logout }), [user, allUsers])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
