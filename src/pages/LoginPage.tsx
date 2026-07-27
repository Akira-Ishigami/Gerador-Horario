import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { CalendarClock, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon, Zap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { MOCK_USERS } from "@/data/mockData"
import { APP_NAME, APP_TAGLINE } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

const MINI_GRID_COLORS = ["bg-brand-400", "bg-accent-400", "bg-emerald-400", "bg-brand-200"]

export default function LoginPage() {
  useSEO({
    title: "Entrar",
    description: `Acesse o painel do ${APP_NAME} e gere a grade horária da sua escola.`,
    path: "/login",
    noIndex: true,
  })

  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState<"login" | "signup">(searchParams.get("modo") === "cadastro" ? "signup" : "login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains("dark")
    root.classList.remove("dark")
    // ThemeProvider (ancestor) re-applies "dark" in its own mount effect, which fires
    // after this one — observer keeps this route forced light regardless of that order.
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) root.classList.remove("dark")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      if (hadDark) root.classList.add("dark")
    }
  }, [])

  const previewUser = useMemo(
    () => MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
    [email],
  )

  if (user) {
    return <Navigate to="/app" replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // pequeno delay só para dar a sensação de "autenticando" (mock)
    setTimeout(() => {
      const result = mode === "signup" ? signup(name, email, password) : login(email, password)
      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate("/app")
    }, 400)
  }

  const switchMode = (next: "login" | "signup") => {
    setMode(next)
    setError(null)
  }

  const fillDemo = (kind: "admin" | "user") => {
    const found = MOCK_USERS.find((u) => u.role === kind)
    if (!found) return
    setEmail(found.email)
    setPassword(found.password)
    setError(null)
  }

  return (
    <div className="grid min-h-screen bg-stone-50 font-landing-sans lg:grid-cols-2">
      {/* Lado visual */}
      <div className="relative hidden overflow-hidden border-r border-stone-900/10 bg-stone-50 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid pointer-events-none absolute inset-0 text-stone-900/6" />
        <div className="animate-orbit pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border border-dashed border-brand-300/40" />

        <Link to="/" className="group relative z-10 flex items-center gap-2 font-landing-display text-lg font-bold text-stone-950">
          <span className="flex h-9 w-9 rotate-3 items-center justify-center rounded-lg bg-stone-900 text-white shadow-[3px_3px_0_0_var(--color-brand-500)] transition-transform duration-300 group-hover:rotate-0">
            <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
          </span>
          {APP_NAME}
        </Link>

        {/* Visual 3D do gerador */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-10" style={{ perspective: 1400 }}>
          <motion.div
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotateY: [-14, -7, -14], rotateX: [7, 4, 7] }}
            transition={{
              opacity: { duration: 0.6 },
              rotateY: { duration: 7, repeat: Infinity, ease: "easeInOut" },
              rotateX: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative"
          >
            <div
              style={{ transform: "translateZ(-50px)" }}
              className="absolute -inset-5 border border-brand-200 bg-brand-50/70"
            />
            <div
              style={{ transform: "translateZ(30px)" }}
              className="hud-corner relative w-72 border border-stone-900/15 bg-white p-5 shadow-[18px_22px_45px_-12px_rgba(79,70,229,0.4)]"
            >
              <div className="mb-3 flex items-center justify-between font-landing-mono text-[10px] uppercase tracking-wider text-stone-400">
                <span>Turma · 6º Ano A</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />0 conflitos
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className={`h-4 rounded-xs ${MINI_GRID_COLORS[i % MINI_GRID_COLORS.length]}`} />
                ))}
              </div>
            </div>
            <motion.div
              style={{ transform: "translateZ(70px)" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-10 flex items-center gap-1.5 border border-stone-900/15 bg-white px-3 py-2 font-landing-mono text-[10px] font-semibold text-brand-600 shadow-[6px_6px_0_0_rgba(20,20,23,0.1)]"
            >
              <Zap className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.25} /> Gerado em 2.4s
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h2 className="max-w-md font-landing-display text-3xl font-bold leading-snug text-stone-950">{APP_TAGLINE}</h2>
          <p className="mt-4 max-w-sm text-stone-500">
            Gerencie turmas, professores e disciplinas em um painel só, e deixe o motor de geração cuidar dos
            conflitos de horário.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-stone-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Ambiente de demonstração — nenhum dado real é enviado.
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mb-8 flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2 font-landing-display text-lg font-bold text-stone-950 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white">
              <CalendarClock className="h-4 w-4" />
            </span>
            {APP_NAME}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "signup" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              }`}
            >
              Criar conta grátis
            </button>
          </div>

          {mode === "login" ? (
            <>
              <h1 className="mt-6 font-landing-display text-2xl font-bold text-stone-950">Bem-vindo de volta</h1>
              <p className="mt-1 text-sm text-stone-500">Entre para acessar o gerador de horários.</p>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("admin")}
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-600"
                >
                  Preencher demo · Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("user")}
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-600"
                >
                  Preencher demo · Usuário
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-landing-display text-2xl font-bold text-stone-950">Comece grátis</h1>
              <p className="mt-1 text-sm text-stone-500">
                Sem cartão de crédito. Sua conta começa no plano Teste grátis (1 turma).
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="text-sm font-medium text-stone-700">
                  Nome
                </label>
                <div className="relative mt-1">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                E-mail
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@escola.com"
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              {mode === "login" && previewUser && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-600"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  {previewUser.name} · {previewUser.role === "admin" ? "Administrador" : "Usuário"}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Senha
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm text-stone-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] hover:bg-brand-700 disabled:opacity-70"
            >
              {mode === "signup" ? (loading ? "Criando conta..." : "Criar conta grátis") : loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-400">
            {mode === "signup"
              ? "Dados fictícios de demonstração — nenhuma cobrança real é feita."
              : "Login de demonstração — use os botões acima para preencher credenciais de teste."}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
