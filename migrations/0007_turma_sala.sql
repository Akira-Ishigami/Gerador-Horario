-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Campo opcional e só informativo (não afeta o gerador nem a grade) para
-- registrar em qual sala/ambiente cada turma tem aula.

alter table public.turmas
  add column if not exists sala text;
