-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Corrige uma falha de segurança real: a policy de update em `profiles`
-- (migrations/0001) restringe por LINHA (auth.uid() = id), mas RLS não
-- restringe por COLUNA. Qualquer usuário logado conseguia rodar
-- `supabase.from('profiles').update({ role: 'admin', plan: 'ouro' })` pelo
-- próprio navegador e se promover sozinho a admin com o plano pago mais caro,
-- de graça, sem passar por nenhum backend.
--
-- Correção: GRANT de coluna (nível do Postgres, separado do RLS) — depois
-- disso, `authenticated` só pode escrever de fato em name/avatar_color;
-- tentar incluir role ou plan no update falha com erro de permissão mesmo
-- a linha sendo do próprio usuário. role/plan só mudam via service_role
-- (Edge Functions ou SQL Editor).

revoke update on public.profiles from authenticated;
grant update (name, avatar_color) on public.profiles to authenticated;
