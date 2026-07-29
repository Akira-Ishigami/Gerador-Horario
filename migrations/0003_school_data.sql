-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Migra turmas, professores, disciplinas, horários/intervalo e a grade
-- gerada do localStorage do navegador pro banco — cada linha pertence a um
-- usuário (user_id) e só ele consegue ler/escrever a própria (RLS).
--
-- Os IDs são texto (não uuid) de propósito: o app já gera ids como
-- "t-<timestamp>", "p-<timestamp>" etc. no cliente antes de salvar, e manter
-- o mesmo formato evita ter que remapear id em memória vs. banco.

create table if not exists public.disciplinas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  cor text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.professores (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  disciplina_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.turmas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  turno text not null check (turno in ('matutino', 'vespertino', 'noturno', 'integral')),
  carga_horaria jsonb not null default '{}',
  dias_funcionamento text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.blocos_horarios (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  inicio text not null,
  fim text not null,
  tipo text not null check (tipo in ('aula', 'intervalo')),
  created_at timestamptz not null default now()
);

-- Uma linha por usuário: a última grade gerada (e os conflitos encontrados).
create table if not exists public.horarios_gerados (
  user_id uuid primary key references auth.users (id) on delete cascade,
  grades jsonb not null default '{}',
  conflitos jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.disciplinas enable row level security;
alter table public.professores enable row level security;
alter table public.turmas enable row level security;
alter table public.blocos_horarios enable row level security;
alter table public.horarios_gerados enable row level security;

-- Mesma política (dono lê/escreve só o próprio) repetida pras 5 tabelas.
-- `drop policy if exists` antes garante que rodar este arquivo de novo não
-- erra com "already exists" (idempotente).
do $$
declare
  t text;
begin
  foreach t in array array['disciplinas', 'professores', 'turmas', 'blocos_horarios'] loop
    execute format('drop policy if exists "Usuário gerencia os próprios registros" on public.%I', t);
    execute format(
      'create policy "Usuário gerencia os próprios registros" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

drop policy if exists "Usuário gerencia a própria grade gerada" on public.horarios_gerados;
create policy "Usuário gerencia a própria grade gerada"
  on public.horarios_gerados for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
