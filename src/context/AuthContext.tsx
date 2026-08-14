import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { PlanId } from "@/config/branding"

export type Role = "admin" | "user"

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  plan: PlanId
  avatarColor: string
  /** nome da instituição/escola, perguntado no início do wizard de configuração — vazio até ser preenchido */
  nomeInstituicao: string
}

interface AuthContextValue {
  user: AppUser | null
  /** true enquanto a sessão do Supabase ainda está sendo restaurada (é assíncrono). */
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true; needsEmailConfirmation: boolean } | { ok: false; error: string }>
  logout: () => Promise<void>
  updateNomeInstituicao: (nome: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface ProfileRow {
  name: string
  role: Role
  plan: PlanId
  avatar_color: string
  nome_instituicao: string | null
}

async function fetchProfile(id: string, email: string): Promise<AppUser | null> {
  // select("*") de propósito (não uma lista explícita de colunas): assim
  // continua funcionando mesmo se `nome_instituicao` (migrations/0015) ainda
  // não tiver rodado no banco — só vem undefined em vez de quebrar a query
  // inteira, igual o padrão já usado pras linhas de turmas/professores.
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single<ProfileRow>()

  if (error || !data) {
    // Perfil ainda não existe (trigger de signup pode levar um instante) ou a
    // migration em migrations/0001_profiles_subscriptions.sql não rodou.
    return null
  }

  return {
    id,
    email,
    name: data.name || email.split("@")[0],
    role: data.role,
    plan: data.plan,
    avatarColor: data.avatar_color,
    nomeInstituicao: data.nome_instituicao ?? "",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? "")
        if (active) setUser(profile)
      }
      if (active) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      if (session?.user) {
        const profile = await fetchProfile(session.user.id, session.user.email ?? "")
        if (active) setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const login: AuthContextValue["login"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { ok: false, error: "E-mail ou senha inválidos." }
    return { ok: true }
  }

  const signup: AuthContextValue["signup"] = async (name, email, password) => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail || !password) {
      return { ok: false, error: "Preencha nome, e-mail e senha." }
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { name: trimmedName } },
    })

    if (error) {
      const msg = error.message.includes("already registered") ? "Já existe uma conta com esse e-mail." : error.message
      return { ok: false, error: msg }
    }

    // Se a confirmação de e-mail estiver ativada no projeto Supabase, `session`
    // vem nulo até o usuário clicar no link recebido por e-mail.
    return { ok: true, needsEmailConfirmation: !data.session }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateNomeInstituicao: AuthContextValue["updateNomeInstituicao"] = async (nome) => {
    if (!user) return
    const trimmed = nome.trim()
    setUser((prev) => (prev ? { ...prev, nomeInstituicao: trimmed } : prev))
    const { error } = await supabase.from("profiles").update({ nome_instituicao: trimmed }).eq("id", user.id)
    if (error) console.error("Erro ao salvar nome da instituição:", error)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateNomeInstituicao }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
