import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { APP_NAME } from "@/config/branding"
import { useSEO } from "@/hooks/useSEO"

type Status = "checking" | "confirmed" | "pending"

const MAX_TENTATIVAS = 10

/**
 * Pra onde o Mercado Pago redireciona depois do checkout (back_url em
 * supabase/functions/create-subscription). A confirmação real acontece no
 * webhook (servidor) — aqui só ficamos de olho no plano do usuário mudar.
 */
export default function PagamentoRetornoPage() {
  useSEO({
    title: "Confirmando pagamento",
    description: `Confirmando sua assinatura no ${APP_NAME}.`,
    path: "/pagamento/retorno",
    noIndex: true,
  })

  const { user } = useAuth()
  const [status, setStatus] = useState<Status>("checking")

  useEffect(() => {
    if (!user) return
    let cancelado = false
    let tentativas = 0

    const checar = async () => {
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
      if (cancelado) return

      if (data && data.plan !== "teste") {
        setStatus("confirmed")
        return
      }

      tentativas++
      if (tentativas < MAX_TENTATIVAS) {
        setTimeout(checar, 2000)
      } else {
        setStatus("pending")
      }
    }

    checar()
    return () => {
      cancelado = true
    }
  }, [user])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 font-landing-sans">
      <div className="w-full max-w-sm border border-stone-900/15 bg-white p-8 text-center shadow-[8px_8px_0_0_rgba(20,20,23,0.06)]">
        {status === "checking" && (
          <>
            <Clock className="mx-auto h-10 w-10 animate-pulse text-brand-500" strokeWidth={1.75} />
            <h1 className="mt-4 font-landing-display text-xl font-bold text-stone-950">Confirmando seu pagamento...</h1>
            <p className="mt-2 text-sm text-stone-500">
              O Mercado Pago está processando — isso costuma levar só alguns segundos.
            </p>
          </>
        )}

        {status === "confirmed" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" strokeWidth={1.75} />
            <h1 className="mt-4 font-landing-display text-xl font-bold text-stone-950">Pagamento confirmado!</h1>
            <p className="mt-2 text-sm text-stone-500">Seu plano já foi atualizado.</p>
            <Link
              to="/app"
              className="mt-6 inline-flex w-full items-center justify-center bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
            >
              Ir para o painel
            </Link>
          </>
        )}

        {status === "pending" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-amber-500" strokeWidth={1.75} />
            <h1 className="mt-4 font-landing-display text-xl font-bold text-stone-950">Ainda processando</h1>
            <p className="mt-2 text-sm text-stone-500">
              Pode levar mais alguns instantes. Se o plano não atualizar, confira no painel em alguns minutos.
            </p>
            <Link
              to="/app"
              className="mt-6 inline-flex w-full items-center justify-center border border-stone-900/15 px-4 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              Ir para o painel mesmo assim
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
