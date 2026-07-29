-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Adiciona a lista de turmas em que cada professor pode dar aula. Vazio
-- continua significando "qualquer turma que precise da disciplina dele"
-- (comportamento de antes) — não quebra contas já existentes.

alter table public.professores
  add column if not exists turma_ids text[] not null default '{}';
