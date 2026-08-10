-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Marca, por turma e disciplina, se as aulas semanais devem ser encaixadas
-- aos pares (2 seguidas, mesmo dia) em vez de espalhadas pela semana.

alter table public.turmas
  add column if not exists carga_horaria_geminada jsonb not null default '{}';
