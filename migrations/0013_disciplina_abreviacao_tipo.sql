-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Nome abreviado (ex: "MAT" pra Matemática) e tipo/classificação livre da
-- disciplina (ex: "Regular", "Eletiva") — só cadastro por enquanto, sem uso
-- no gerador ainda.

alter table public.disciplinas
  add column if not exists nome_abreviado text,
  add column if not exists tipo text;
