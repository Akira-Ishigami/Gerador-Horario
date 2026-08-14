-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Aulas "presas" num dia/horário fixo (Controles → Fixar Aulas) — o gerador
-- coloca essas primeiro e nunca move nem sobrescreve o slot.

alter table public.turmas
  add column if not exists aulas_fixas jsonb not null default '[]';
