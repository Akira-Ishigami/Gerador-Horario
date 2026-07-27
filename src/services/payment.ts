import type { PlanId } from "@/config/branding"

/**
 * Camada de pagamento — hoje é 100% mock (sem cobrança real).
 * Quando a integração com o Mercado Pago for feita, troque apenas o corpo
 * destas funções pela chamada real ao SDK/Checkout Pro; nada em outras
 * partes do app precisa mudar (todo mundo chama por esta interface).
 *
 * Passos para a integração real:
 * 1. Criar as credenciais em https://www.mercadopago.com.br/developers
 * 2. Preencher VITE_MERCADOPAGO_PUBLIC_KEY no .env (ver .env.example)
 * 3. No backend (a criar), gerar a preferência de pagamento e expor um endpoint,
 *    ex: POST /api/checkout { planId } -> { initPoint }
 * 4. Nesta função, chamar esse endpoint e redirecionar para `initPoint`.
 */

export interface CheckoutResult {
  ok: boolean
  redirectUrl?: string
  message: string
}

export const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as
  | string
  | undefined

export async function createCheckoutSession(planId: PlanId): Promise<CheckoutResult> {
  // MOCK: simula latência de rede e retorna sucesso sem cobrar nada.
  await new Promise((resolve) => setTimeout(resolve, 600))

  if (!MERCADOPAGO_PUBLIC_KEY) {
    return {
      ok: true,
      message: `[MOCK] Checkout do plano "${planId}" simulado — integração com Mercado Pago ainda não conectada.`,
    }
  }

  // Quando o backend existir, troque por: fetch("/api/checkout", { method: "POST", body: JSON.stringify({ planId }) })
  return {
    ok: true,
    message: `[MOCK] Preferência de pagamento para "${planId}" seria criada aqui via Mercado Pago.`,
  }
}
