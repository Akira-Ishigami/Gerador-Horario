import { useMemo, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { CalendarClock, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MOCK_USERS } from "@/data/mockData"
import { APP_NAME, APP_TAGLINE } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

export default function LoginPage() {
  useSEO({
    title: "Entrar",
    description: `Acesse o painel do ${APP_NAME} e gere a grade horária da sua escola.`,
    path: "/login",
    noIndex: true,
  })

  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      const result = login(email, password)
      setLoading(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate("/app")
    }, 400)
  }

  const fillDemo = (kind: "admin" | "user") => {
    const found = MOCK_USERS.find((u) => u.role === kind)
    if (!found) return
    setEmail(found.email)
    setPassword(found.password)
    setError(null)
  }

  return (
    <div className="grid min-h-screen bg-white dark:bg-slate-950 lg:grid-cols-2">
      {/* Lado visual */}
      <div className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0 text-white/10" />
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent-500/30 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2 font-display text-lg font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg">
            <CalendarClock className="h-5 w-5" strokeWidth={2.25} />
          </span>
          {APP_NAME}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <h2 className="max-w-md font-display text-3xl font-bold leading-snug text-white">{APP_TAGLINE}</h2>
          <p className="mt-4 max-w-sm text-slate-300">
            Gerencie turmas, professores e disciplinas em um painel só, e deixe o motor de geração cuidar dos
            conflitos de horário.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Ambiente de demonstração — nenhum dado real é enviado.
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mb-8 flex items-center justify-between lg:justify-end">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white">
              <CalendarClock className="h-4 w-4" />
            </span>
            {APP_NAME}
          </Link>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Entre para acessar o gerador de horários.</p>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              Preencher demo · Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("user")}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              Preencher demo · Usuário
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                E-mail
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@escola.com"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              {previewUser && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  {previewUser.name} · {previewUser.role === "admin" ? "Administrador" : "Usuário"}
                </motion.p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] hover:bg-brand-700 disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Login de demonstração — use os botões acima para preencher credenciais de teste.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
