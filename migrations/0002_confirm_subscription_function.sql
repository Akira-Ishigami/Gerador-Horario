-- Função que confirma o status de uma assinatura vindo do webhook do Mercado
-- Pago: atualiza a linha em `subscriptions` e o `plan` em `profiles` na mesma
-- transação (antes eram dois updates separados, com risco de um falhar sem o
-- outro). Só o service_role pode chamar (é o que o Edge Function usa).

create or replace function public.confirm_subscription(
  p_preapproval_id text,
  p_status text,
  p_current_period_end timestamptz,
  p_user_id uuid,
  p_plan_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
  set
    status = p_status,
    current_period_end = p_current_period_end,
    updated_at = now()
  where mp_preapproval_id = p_preapproval_id;

  update public.profiles
  set plan = case when p_status = 'authorized' then p_plan_id else 'teste' end
  where id = p_user_id;
end;
$$;

revoke all on function public.confirm_subscription(text, text, timestamptz, uuid, text) from public, anon, authenticated;
grant execute on function public.confirm_subscription(text, text, timestamptz, uuid, text) to service_role;
