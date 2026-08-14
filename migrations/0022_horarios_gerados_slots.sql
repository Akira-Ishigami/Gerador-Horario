-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Até então `horarios_gerados` guardava só 1 grade por usuário (user_id
-- era a chave primária). Agora vira até 4 "slots" nomeados por usuário —
-- tipo save de jogo: salva, sobrescreve, renomeia. Linhas existentes viram
-- automaticamente o slot 1 (o default do slot_id), sem perder nada.

alter table public.horarios_gerados
  add column if not exists slot_id smallint not null default 1;

alter table public.horarios_gerados
  add column if not exists nome text not null default 'Horário 1';

alter table public.horarios_gerados
  drop constraint if exists horarios_gerados_pkey;

alter table public.horarios_gerados
  add constraint horarios_gerados_slot_id_check check (slot_id between 1 and 4);

alter table public.horarios_gerados
  add constraint horarios_gerados_pkey primary key (user_id, slot_id);
