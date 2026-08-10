-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Antes, um professor tinha uma lista de disciplinas E uma lista de turmas
-- SEPARADAS (dava todas as disciplinas em todas as turmas marcadas) — não
-- dava pra dizer "Educação Física pra todas as turmas, mas Trilha só pro 8º
-- ano". Agora a restrição de turma é por disciplina.
--
-- Adiciona a coluna nova e MIGRA os dados existentes: cada disciplina que o
-- professor já dava vira uma entrada com a mesma lista de turmas que ele já
-- tinha (preserva o comportamento de antes pra quem já configurou professor
-- antes desta mudança). As colunas antigas (disciplina_ids, turma_ids) ficam
-- no banco sem uso — não valia o risco de já dropar agora.

alter table public.professores
  add column if not exists turmas_por_disciplina jsonb not null default '{}';

update public.professores as p
set turmas_por_disciplina = coalesce(
  (select jsonb_object_agg(d, to_jsonb(p.turma_ids)) from unnest(p.disciplina_ids) as d),
  '{}'::jsonb
)
where p.turmas_por_disciplina = '{}'::jsonb
  and p.disciplina_ids is not null
  and array_length(p.disciplina_ids, 1) > 0;
