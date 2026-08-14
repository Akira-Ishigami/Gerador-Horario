-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Restringe uma disciplina a só poder ter aula em certos horários do dia
-- (ex: Educação Física nunca no último horário) — turno-agnóstico, mesma
-- convenção de `professores.indisponibilidades`. Vazio = sem restrição.

alter table public.disciplinas
  add column if not exists horarios_permitidos jsonb not null default '[]';
