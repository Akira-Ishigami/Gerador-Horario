-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Tabela `recursos` (Controles → Recursos): salas/laboratórios/quadras com
-- capacidade limitada, vinculados às disciplinas que os usam — o gerador
-- evita escalar mais turmas simultâneas num recurso do que `quantidade`.

create table if not exists public.recursos (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  quantidade integer not null default 1,
  disciplina_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.recursos enable row level security;

drop policy if exists "Usuário gerencia os próprios registros" on public.recursos;
create policy "Usuário gerencia os próprios registros"
  on public.recursos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
