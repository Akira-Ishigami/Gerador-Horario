-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- 1) Corrige um erro da migration anterior: a PK de disciplinas/professores/
--    turmas/blocos_horarios era só `id`, mas o id é gerado no cliente (ex:
--    "mat", "p-123...") e pode repetir entre usuários diferentes — precisa
--    ser composta com user_id.
-- 2) Semeia o catálogo padrão de disciplinas (Matemática, Português...) uma
--    única vez, no momento em que a conta é criada — em vez de o cliente
--    decidir "lista vazia = conta nova" (ambíguo: também fica vazia se o
--    usuário apagar tudo de propósito).

-- `if exists` deixa seguro rodar de novo (idempotente).
alter table public.disciplinas drop constraint if exists disciplinas_pkey;
alter table public.disciplinas add primary key (id, user_id);

alter table public.professores drop constraint if exists professores_pkey;
alter table public.professores add primary key (id, user_id);

alter table public.turmas drop constraint if exists turmas_pkey;
alter table public.turmas add primary key (id, user_id);

alter table public.blocos_horarios drop constraint if exists blocos_horarios_pkey;
alter table public.blocos_horarios add primary key (id, user_id);

create or replace function public.handle_new_user_disciplinas()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.disciplinas (id, user_id, nome, cor) values
    ('mat', new.id, 'Matemática', '#6366f1'),
    ('port', new.id, 'Português', '#ec4899'),
    ('cien', new.id, 'Ciências', '#22c55e'),
    ('hist', new.id, 'História', '#f59e0b'),
    ('geo', new.id, 'Geografia', '#06b6d4'),
    ('ing', new.id, 'Inglês', '#a855f7'),
    ('edf', new.id, 'Educação Física', '#ef4444'),
    ('arte', new.id, 'Artes', '#eab308');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_disciplinas on auth.users;
create trigger on_auth_user_created_disciplinas
  after insert on auth.users
  for each row execute function public.handle_new_user_disciplinas();
