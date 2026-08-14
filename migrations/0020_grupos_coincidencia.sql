-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Tabela `grupos_coincidencia` (Controles → Turmas → Coincidir aulas):
-- turmas que devem ter a mesma disciplina no mesmo dia/horário (ex: todas
-- as turmas do 8º ano com Educação Física junto).

create table if not exists public.grupos_coincidencia (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  disciplina_id text not null,
  turma_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.grupos_coincidencia enable row level security;

drop policy if exists "Usuário gerencia os próprios registros" on public.grupos_coincidencia;
create policy "Usuário gerencia os próprios registros"
  on public.grupos_coincidencia for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
