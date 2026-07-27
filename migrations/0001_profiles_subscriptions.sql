-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Cria:
--   1. profiles      — dados do app por usuário (nome, papel, plano), 1:1 com auth.users
--   2. subscriptions — histórico de assinaturas do Mercado Pago por usuário
-- e as políticas de RLS: cada usuário só lê/edita o próprio registro; só o
-- service_role (usado pelas Edge Functions, nunca pelo navegador) pode
-- escrever em subscriptions ou trocar o plano em profiles.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'teste' check (plan in ('teste', 'bronze', 'prata', 'ouro')),
  avatar_color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuário lê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário edita o próprio nome/avatar (não o plano)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cria o profile automaticamente quando alguém se cadastra (auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null check (plan_id in ('bronze', 'prata', 'ouro')),
  mp_preapproval_id text unique,
  status text not null default 'pending' check (status in ('pending', 'authorized', 'paused', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Usuário lê as próprias assinaturas"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Sem política de insert/update/delete para "authenticated"/"anon" de propósito:
-- só as Edge Functions (com a service_role key) podem escrever aqui, o que
-- garante que ninguém marca o próprio plano como pago direto pelo navegador.
