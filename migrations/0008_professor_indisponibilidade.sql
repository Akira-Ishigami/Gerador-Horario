-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Dias/horários em que cada professor não pode dar aula — o gerador passa a
-- respeitar isso como restrição obrigatória (igual a um conflito de agenda).

alter table public.professores
  add column if not exists indisponibilidades jsonb not null default '[]';
