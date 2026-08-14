-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Tabela `grupos_disciplinas` (Controles → Disciplinas → Limitar grupo de
-- disciplinas): agrupa disciplinas relacionadas e limita quantas aulas do
-- grupo somado uma turma pode ter no mesmo dia.

create table if not exists public.grupos_disciplinas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  disciplina_ids jsonb not null default '[]',
  max_por_dia integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.grupos_disciplinas enable row level security;

drop policy if exists "Usuário gerencia os próprios registros" on public.grupos_disciplinas;
create policy "Usuário gerencia os próprios registros"
  on public.grupos_disciplinas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
