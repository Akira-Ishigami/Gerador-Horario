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
- `0016_recursos.sql` — tabela `recursos` (salas/laboratórios/quadras com
  capacidade limitada, vinculados às disciplinas que os usam), com RLS.
  Usada em Controles → Recursos; o gerador evita escalar mais turmas
  simultâneas num recurso do que a quantidade cadastrada.
- `0017_professor_concentrar_dias.sql` — coluna `concentrar_dias` em
  `professores`: preferência (não bloqueio) pro gerador tentar concentrar
  as aulas do professor em menos dias da semana.
- `0018_turma_aulas_fixas.sql` — coluna `aulas_fixas` em `turmas`: aulas
  presas num dia/horário fixo (Controles → Fixar Aulas), que o gerador
  coloca antes do resto e nunca move.
- `0019_disciplina_horarios_permitidos.sql` — coluna `horarios_permitidos`
  em `disciplinas`: restringe a disciplina a só poder cair em certos
  horários do dia (Controles → Limitar Horários).
- `0020_grupos_coincidencia.sql` — tabela `grupos_coincidencia`: turmas que
  devem ter a mesma disciplina no mesmo dia/horário (Controles → Turmas →
  Coincidir aulas), com RLS.
- `0021_grupos_disciplinas.sql` — tabela `grupos_disciplinas`: agrupa
  disciplinas relacionadas e limita aulas do grupo por dia (Controles →
  Disciplinas → Limitar grupo de disciplinas), com RLS.
- `0022_horarios_gerados_slots.sql` — `horarios_gerados` passa de 1 linha
  por usuário pra até 4 "slots" nomeados (`slot_id` 1-4 + `nome`), chave
  primária composta `(user_id, slot_id)`. Linhas existentes viram o slot 1
  automaticamente.
