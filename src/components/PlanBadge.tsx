import { Link } from "react-router-dom"
import { Crown, Medal, Award, Sparkles } from "lucide-react"
import { getPlan, type PlanId } from "@/config/branding"

const PLAN_STYLE: Record<PlanId, { icon: typeof Crown; ring: string; text: string; bar: string }> = {
  teste: {
    icon: Sparkles,
    ring: "ring-brand-400/40",
    text: "text-brand-600 dark:text-brand-400",
    bar: "bg-brand-500",
  },
  bronze: {
    icon: Medal,
    ring: "ring-amber-400/40",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  prata: {
    icon: Award,
    ring: "ring-slate-400/50",
    text: "text-slate-600 dark:text-slate-300",
    bar: "bg-slate-400",
  },
  ouro: {
    icon: Crown,
    ring: "ring-yellow-400/60",
    text: "text-yellow-600 dark:text-yellow-400",
    bar: "bg-gradient-to-r from-yellow-400 to-amber-500",
  },
}

interface PlanBadgeProps {
  planId: PlanId
  turmasUsadas: number
}

export function PlanBadge({ planId, turmasUsadas }: PlanBadgeProps) {
  const plan = getPlan(planId)
  const style = PLAN_STYLE[planId]
  const Icon = style.icon
  const max = plan.maxTurmas
  const pct = max ? Math.min(100, (turmasUsadas / max) * 100) : 18
  const proximoLimite = max !== null && turmasUsadas >= max

  return (
    <div className={`glass w-full max-w-xs rounded-2xl p-4 shadow-lg ring-1 ${style.ring}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 dark:bg-white/10 ${style.text}`}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Plano atual</p>
            <p className={`font-display text-sm font-semibold ${style.text}`}>{plan.name}</p>
          </div>
        </div>
        <span className="font-display text-xs font-medium text-slate-500 dark:text-slate-400">
          {max === null ? "Ilimitado" : `${turmasUsadas}/${max}`}
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {proximoLimite && (
        <p className="mt-2 text-xs text-rose-500">
          Limite de turmas atingido.{" "}
          <Link to="/#planos" className="font-medium underline underline-offset-2">
            Fazer upgrade
          </Link>
        </p>
      )}
    </div>
  )
}
