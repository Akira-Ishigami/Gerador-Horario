// Edge Function: mercadopago-webhook
//
// URL pública que você cadastra no painel do Mercado Pago (Sua integração >
// Webhooks) pro evento "Assinaturas" (subscription_preapproval). O Mercado
// Pago chama esta URL sozinho quando um pagamento de assinatura é aprovado,
// falha, é pausado ou cancelado — é isso que atualiza o banco automaticamente,
// sem o usuário precisar voltar pro site pra "confirmar" nada.
//
// Deploy com --no-verify-jwt (o Mercado Pago não manda um JWT do Supabase):
//   supabase functions deploy mercadopago-webhook --no-verify-jwt
//
// Segurança: nunca confiamos no corpo da notificação sozinho — sempre
// buscamos os dados de verdade na API do Mercado Pago usando o id recebido.

import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado.")
      return new Response("ok", { status: 200 }) // responde 200 mesmo assim pro MP não ficar retentando
    }

    const url = new URL(req.url)
    let type = url.searchParams.get("type") ?? url.searchParams.get("topic")
    let preapprovalId = url.searchParams.get("data.id") ?? url.searchParams.get("id")

    if (req.method === "POST") {
      const body = await req.json().catch(() => null)
      if (body) {
        type = body.type ?? body.topic ?? type
        preapprovalId = body.data?.id ?? body.id ?? preapprovalId
      }
    }

    if (type !== "subscription_preapproval" && type !== "preapproval") {
      // Outro tipo de evento (ex: pagamento avulso) — ignoramos por enquanto.
      return new Response("ok", { status: 200 })
    }

    if (!preapprovalId) {
      return new Response("ok", { status: 200 })
    }

    // Nunca confie no payload da notificação — busca o estado real na API do MP.
    const detailRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!detailRes.ok) {
      console.error("Erro ao buscar preapproval no Mercado Pago:", await detailRes.text())
      return new Response("ok", { status: 200 })
    }

    const preapproval = await detailRes.json()
    const status = preapproval.status as string // "authorized" | "paused" | "cancelled" | "pending"
    const [userId, planId] = String(preapproval.external_reference ?? "").split(":")

    if (!userId || !planId) {
      console.error("external_reference inválido:", preapproval.external_reference)
      return new Response("ok", { status: 200 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // O pulo do gato: isso é o que dá acesso ao plano pago de verdade — só
    // acontece aqui, no servidor, depois de confirmar direto com o Mercado Pago.
    // confirm_subscription (ver migrations/0002_confirm_subscription_function.sql)
    // atualiza subscriptions + profiles.plan na mesma transação.
    const { error: rpcError } = await supabaseAdmin.rpc("confirm_subscription", {
      p_preapproval_id: preapprovalId,
      p_status: status,
      p_current_period_end: preapproval.next_payment_date ?? null,
      p_user_id: userId,
      p_plan_id: planId,
    })

    if (rpcError) {
      console.error("Erro ao confirmar subscription:", rpcError)
    }

    return new Response("ok", { status: 200 })
  } catch (err) {
    console.error(err)
    // Sempre 200 pro Mercado Pago não entrar num loop de retentativas por erro nosso.
    return new Response("ok", { status: 200 })
  }
})
