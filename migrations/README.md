# Migrations

SQL do banco (Supabase/Postgres), numerado em ordem. Rode cada arquivo uma
vez no SQL Editor do seu projeto Supabase, na ordem dos números.

- `0001_profiles_subscriptions.sql` — tabelas `profiles` (dados do usuário:
  nome, papel, plano) e `subscriptions` (histórico de assinaturas do
  Mercado Pago), com as políticas de RLS. Ver [`../supabase/README.md`](../supabase/README.md)
  para o passo a passo completo de conectar o backend (Edge Functions +
  Mercado Pago).
