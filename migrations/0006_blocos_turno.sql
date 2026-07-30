-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Cada turno (matutino/vespertino/noturno/integral) passa a ter seus
-- próprios horários de aula (ex: matutino 07h-12h, noturno 19h-22h30) em vez
-- de uma única lista compartilhada por todas as turmas. Linhas existentes
-- viram 'matutino' automaticamente (era o único turno suportado até aqui).

alter table public.blocos_horarios
  add column if not exists turno text not null default 'matutino'
    check (turno in ('matutino', 'vespertino', 'noturno', 'integral'));
