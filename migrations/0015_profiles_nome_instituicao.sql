-- Rode isto uma vez no SQL Editor do seu projeto Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- Nome da instituição/escola, perguntado no início do wizard de
-- configuração — guardado no perfil do usuário (não por turma).
--
-- Reaplica o GRANT de coluna de migrations/0011_profiles_column_privileges.sql
-- incluindo a nova coluna — sem isso, o update falha silenciosamente no
-- client (o grant anterior só liberava name/avatar_color).

alter table public.profiles
  add column if not exists nome_instituicao text;

revoke update on public.profiles from authenticated;
grant update (name, avatar_color, nome_instituicao) on public.profiles to authenticated;
