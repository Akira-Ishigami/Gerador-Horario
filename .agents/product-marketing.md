# Product Marketing Context

*Last updated: 2026-07-27*
*Drafted automatically from the codebase (README, branding.ts, LandingPage.tsx). Review and correct freely.*

## Product Overview
**One-liner:** Horária monta a grade horária da escola automaticamente, sem choques de professores.
**What it does:** SaaS que gera a grade horária escolar (turmas × disciplinas × professores) em minutos, detecta e evita conflitos de horário automaticamente, e permite exportar a grade pronta para compartilhar com professores e responsáveis.
**Product category:** Software de gestão escolar / gerador de horário escolar (timetabling).
**Product type:** SaaS B2B (vertical education).
**Business model:** Assinatura mensal ou anual, por número de turmas (Bronze/Prata/Ouro).

## Target Audience
**Target companies:** Escolas de ensino fundamental/médio, pequenas e médias, e potencialmente redes de ensino (plano Ouro cobre múltiplas unidades).
**Decision-makers:** Coordenação pedagógica e direção escolar.
**Primary use case:** Substituir a montagem manual da grade horária (planilha/papel) por um processo automático, rápido e sem conflitos.
**Jobs to be done:**
- Montar a grade horária do semestre/ano sem gastar dias remontando choques manualmente.
- Garantir que nenhum professor seja escalado em duas turmas no mesmo horário.
- Ter uma grade visual, exportável e fácil de compartilhar com a equipe.
**Use cases:**
- Início de semestre/ano letivo: montagem da grade do zero.
- Mudança de professor ou disciplina no meio do período: reorganizar sem gerar novos conflitos.
- Rede de ensino com várias unidades: padronizar o processo entre escolas.

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Coordenador(a) pedagógico(a) — usuário principal | Montar a grade rápido, sem erro, sem estresse de última hora | Perde dias em planilha, refazendo tudo a cada conflito descoberto tarde | Grade pronta em minutos, conflitos detectados antes de publicar |
| Direção escolar — decisor/financeiro | Confiabilidade, custo previsível, pouca dependência de uma pessoa só | Processo manual depende do conhecimento de uma pessoa específica | Ferramenta simples que qualquer coordenador consegue operar |

## Problems & Pain Points
**Core problem:** Montar a grade horária escolar manualmente (planilha) é lento, repetitivo e propenso a erro humano — especialmente evitar que o mesmo professor seja escalado em duas turmas no mesmo horário.
**Why alternatives fall short:**
- Planilha: nenhuma verificação automática de conflito; erro só aparece quando já é tarde.
- Concorrentes BR estabelecidos (GridClass, PowerCubus) têm preço de entrada mais alto e curva de aprendizado maior.
**What it costs them:** Dias (às vezes semanas) de trabalho manual da coordenação por período letivo; retrabalho quando um conflito é descoberto depois de publicado.
**Emotional tension:** Ansiedade de "vou publicar e vai ter algo errado", frustração de refazer a mesma planilha várias vezes.

## Competitive Landscape
**Direct:** GridClass (BR) — mais caro no tier de entrada (~R$116/mês para até 20 turmas) e mais voltado a redes maiores.
**Direct:** PowerCubus (BR) — free até 3 turmas, depois planos Standard/Advanced/Premium; posicionamento mais corporativo.
**Secondary:** Planilha manual (Excel/Google Sheets) — grátis, mas sem geração automática nem verificação de conflitos.
**Indirect:** Softwares de gestão escolar completos (ERP escolar) que incluem timetabling como módulo secundário, não como foco.

## Differentiation
**Key differentiators:**
- Geração automática com detecção de conflito em tempo real (não é só um editor de grade manual).
- Interface simples, sem curva de aprendizado — pensado para coordenador, não para TI da escola.
- Preço de entrada abaixo dos concorrentes BR estabelecidos.
**How we do it differently:** Motor de geração guloso que distribui aulas evitando choques de professor automaticamente, com fallback de conflito reportado (não trava o sistema).
**Why that's better:** Menos tempo manual, menos erro, sem precisar de treinamento.
**Why customers choose us:** Mais barato para entrar, mais rápido para colocar em uso no primeiro dia.

## Objections
| Objection | Response |
|-----------|----------|
| "Já uso planilha, funciona" | Funciona até o primeiro conflito descoberto tarde — o gerador evita isso automaticamente e economiza dias por período letivo. |
| "Minha escola é pequena, não preciso de software" | Plano Bronze cobre até 10 turmas por R$ 49,90/mês, pensado exatamente para esse porte. |
| "Preciso migrar dados de outra ferramenta" | Cadastro de turmas/disciplinas/professores é simples e leva poucos minutos, sem migração complexa. |

**Anti-persona:** Escolas sem nenhuma estrutura de coordenação central, ou redes gigantes que já têm ERP escolar customizado com timetabling embutido.

## Switching Dynamics
**Push:** Tempo perdido remontando planilha, medo de publicar grade com erro.
**Pull:** Grade pronta em minutos, zero conflitos, preço acessível.
**Habit:** Planilha já é conhecida pela equipe, "sempre foi assim".
**Anxiety:** Confiar que o algoritmo realmente vai gerar uma grade correta e utilizável, sem precisar refazer tudo manualmente depois.

## Customer Language
**How they describe the problem:** "gastar dias montando horário", "choque de professor", "descobrir o conflito só depois de publicar"
**How they describe us:** "gerador de horário escolar", "grade automática", "sem choque de professor"
**Words to use:** grade horária, choque/conflito de horário, geração automática, coordenação, turmas
**Words to avoid:** jargão técnico de "otimização"/"algoritmo" em excesso — o público é pedagógico, não técnico.
**Glossary:**
| Term | Meaning |
|------|---------|
| Grade horária | O horário semanal completo de uma turma/escola |
| Conflito/choque | Mesmo professor ou turma alocado em dois lugares no mesmo horário |
| Turma | Uma turma/classe da escola (ex: 6º Ano A) |

## Brand Voice
**Tone:** Direto, confiante, sem jargão técnico — fala com quem coordena a escola, não com TI.
**Style:** Frases curtas, foco em resultado prático ("pronto em minutos", "zero conflitos").
**Personality:** Confiável, moderno/futurista, eficiente, acessível.

## Proof Points
**Metrics:** (nenhum dado real de cliente ainda — protótipo/pré-lançamento)
**Customers:** Nenhum ainda (produto em fase de protótipo/lançamento).
**Testimonials:** Nenhum ainda.
**Value themes:**
| Theme | Proof |
|-------|-------|
| Velocidade | "Pronto em minutos, não em semanas" |
| Confiabilidade | Detecção automática de conflitos antes de publicar |
| Acessibilidade | Planos a partir de R$ 49,90/mês, abaixo dos concorrentes BR |

## Goals
**Primary business goal:** Conquistar as primeiras escolas pagantes (aquisição inicial) num mercado com concorrentes BR já estabelecidos.
**Key conversion action:** Criar conta gratuita (CTA "Começar agora") e gerar a primeira grade.
**Current metrics:** Nenhum ainda — pré-lançamento.
