-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Preferência por professor: tentar concentrar as aulas dele nos dias em
-- que já dá aula, deixando algum dia livre — o gerador passa a usar isso
-- como critério de desempate (não como bloqueio, então nunca cria conflito
-- novo por si só). Ver `scheduleGenerator.ts`.

alter table public.professores
  add column if not exists concentrar_dias boolean not null default false;
