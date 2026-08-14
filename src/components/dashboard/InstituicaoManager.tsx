import { useEffect, useState } from "react"
import { Check, Building2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

/** Dados da instituição (Configurações) — hoje só o nome, perguntado originalmente no wizard de onboarding. */
export function InstituicaoManager() {
  const { user, updateNomeInstituicao } = useAuth()
  const [nome, setNome] = useState(user?.nomeInstituicao ?? "")
  const [salvo, setSalvo] = useState(false)

  // reflete se o nome mudar por fora (ex: outra aba) — não sobrescreve
  // enquanto o campo está sendo editado (só quando o valor de fato diverge).
  useEffect(() => {
    setNome(user?.nomeInstituicao ?? "")
  }, [user?.nomeInstituicao])

  const salvarSeMudou = () => {
    const trimmed = nome.trim()
    if (!user || trimmed === user.nomeInstituicao) return
    void updateNomeInstituicao(trimmed)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 1500)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-800 dark:text-white">
        <Building2 className="h-4 w-4 text-brand-600" /> Instituição
      </h2>
      <p className="mb-4 text-xs text-slate-400">Nome da escola ou rede de ensino, usado nas telas e nos horários exportados.</p>

      <label className="block max-w-sm">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Nome da instituição</span>
        <div className="mt-0.5 flex items-center gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={salvarSeMudou}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
            }}
            placeholder="Ex: Escola Municipal João de Barro"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          {salvo && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
        </div>
      </label>
    </div>
  )
}
