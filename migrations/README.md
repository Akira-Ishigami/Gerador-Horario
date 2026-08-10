# Migrations

SQL do banco (Supabase/Postgres), numerado em ordem. Rode cada arquivo uma
vez no SQL Editor do seu projeto Supabase, na ordem dos números.

- `0001_profiles_subscriptions.sql` — tabelas `profiles` (dados do usuário:
  nome, papel, plano) e `subscriptions` (histórico de assinaturas), com as
  políticas de RLS.
- `0002_confirm_subscription_function.sql` — função `confirm_subscription`
  (só `service_role`), usada por uma Edge Function de pagamento que não faz
  mais parte do projeto — mantida por ser histórico já aplicado no banco.
- `0003_school_data.sql` — tabelas `turmas`, `professores`, `disciplinas`,
  `blocos_horarios`, `horarios_gerados`, com RLS (dono lê/escreve só o
  próprio registro).
- `0004_seed_disciplinas_trigger.sql` — semeia o catálogo padrão de
  disciplinas pra conta nova.
- `0005_professor_turmas.sql` — coluna `turma_ids` em `professores`
  (superada pela `0010`).
- `0006_blocos_turno.sql` — coluna `turno` em `blocos_horarios` (cada turno
  passa a ter seus próprios horários).
- `0007_turma_sala.sql` — coluna `sala` (informativa) em `turmas`.
- `0008_professor_indisponibilidade.sql` — coluna `indisponibilidades` em
  `professores`.
- `0009_turma_carga_geminada.sql` — coluna `carga_horaria_geminada` em
  `turmas` (aula geminada).
- `0010_professor_turmas_por_disciplina.sql` — coluna
  `turmas_por_disciplina` em `professores` (restrição de turma por
  matéria); migra os dados de `disciplina_ids`/`turma_ids`.
- `0011_profiles_column_privileges.sql` — corrige uma falha de segurança:
  a policy de update em `profiles` restringia por linha, não por coluna,
  então qualquer usuário conseguia trocar o próprio `role`/`plan` direto
  pelo navegador. **Rode assim que possível se ainda não rodou.**
