-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Recreio próprio da turma (por posição — depois de qual aula do turno,
-- não horário fixo) e código secreto de acesso — só cadastro por enquanto,
-- sem uso no gerador ainda.

alter table public.turmas
  add column if not exists recreio_depois_da_aula integer,
  add column if not exists recreio_duracao_min integer,
  add column if not exists codigo_secreto text;
