// Edge Function: create-subscription
//
// Chamada pelo frontend (autenticado) quando o usuário clica em "Escolher
// {plano}". Cria uma assinatura recorrente no Mercado Pago (Preapproval API)
// e devolve o link de checkout (init_point) pro frontend redirecionar.
//
// Segredos necessários (configure com `supabase secrets set`):
//   MERCADOPAGO_ACCESS_TOKEN — access token do Mercado Pago (nunca o público)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — já vêm prontos no ambiente
//     de toda Edge Function do Supabase, não precisa configurar.
//   APP_URL — domínio do site (ex: https://horaria.app), usado no back_url
//     pra onde o Mercado Pago redireciona depois do checkout.

import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { isPaidPlanId, PAID_PLAN_PRICES } from "../_shared/plans.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return json({ error: "Não autenticado." }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173"

    if (!accessToken) {
      return json({ error: "MERCADOPAGO_ACCESS_TOKEN não configurado nas secrets da função." }, 500)
    }

    // Cliente "do usuário" — só pra validar o JWT recebido e descobrir quem está chamando.
    const supabaseAsUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await supabaseAsUser.auth.getUser()

    if (userError || !user) {
      return json({ error: "Sessão inválida." }, 401)
    }

    const { planId } = await req.json().catch(() => ({ planId: null }))
    if (typeof planId !== "string" || !isPaidPlanId(planId)) {
      return json({ error: "Plano inválido." }, 400)
    }

    const preapprovalRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Horária - Plano ${planId}`,
        back_url: `${appUrl}/pagamento/retorno`,
        payer_email: user.email,
        external_reference: `${user.id}:${planId}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: PAID_PLAN_PRICES[planId],
          currency_id: "BRL",
        },
      }),
    })

    if (!preapprovalRes.ok) {
      const detail = await preapprovalRes.text()
      console.error("Mercado Pago preapproval error:", detail)
      return json({ error: "Não foi possível criar a assinatura no Mercado Pago." }, 502)
    }

    const preapproval = await preapprovalRes.json()

    // service_role: só a função pode escrever em subscriptions (RLS bloqueia o cliente).
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { error: insertError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      mp_preapproval_id: preapproval.id,
      status: "pending",
    })

    if (insertError) {
      console.error("Erro ao salvar subscription:", insertError)
      return json({ error: "Assinatura criada no Mercado Pago, mas falhou ao salvar no banco." }, 500)
    }

    return json({ init_point: preapproval.init_point })
  } catch (err) {
    console.error(err)
    return json({ error: "Erro inesperado." }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
