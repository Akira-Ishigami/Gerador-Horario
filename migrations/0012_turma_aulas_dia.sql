-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Campos de cadastro por enquanto (sem validação/uso no gerador ainda):
-- aulas_semanais é a meta/total esperado de aulas por semana da turma;
-- min/max_aulas_dia são restrições pro gerador respeitar numa próxima etapa.

alter table public.turmas
  add column if not exists aulas_semanais integer,
  add column if not exists min_aulas_dia integer,
  add column if not exists max_aulas_dia integer;
