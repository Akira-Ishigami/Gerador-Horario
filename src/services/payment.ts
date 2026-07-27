import { supabase } from "@/lib/supabaseClient"
import type { PlanId } from "@/config/branding"

/**
 * Cria uma assinatura recorrente no Mercado Pago chamando a Edge Function
 * `create-subscription` (o Access Token do Mercado Pago só existe lá, nunca
 * aqui no navegador). Retorna o link de checkout hospedado pelo Mercado Pago
 * — redirecione o navegador pra `initPoint` pra o usuário pagar.
 *
 * Ver supabase/functions/create-subscription e
 * supabase/functions/mercadopago-webhook (confirma o pagamento e atualiza o
 * plano do usuário sozinho, do lado do servidor).
 */

export interface CheckoutResult {
  ok: boolean
  initPoint?: string
  error?: string
}

export async function createCheckoutSession(planId: PlanId): Promise<CheckoutResult> {
  if (planId === "teste") {
    return { ok: false, error: "O plano Teste grátis não passa por checkout." }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { ok: false, error: "Você precisa estar logado para assinar um plano." }
  }

  const { data, error } = await supabase.functions.invoke<{ init_point?: string; error?: string }>(
    "create-subscription",
    { body: { planId } },
  )

  if (error) {
    return { ok: false, error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." }
  }
  if (!data?.init_point) {
    return { ok: false, error: data?.error ?? "Resposta inesperada do servidor de pagamento." }
  }

  return { ok: true, initPoint: data.init_point }
}
