# Horária — Gerador de Horário Escolar (protótipo)

> **O nome "Horária" é provisório.** Troque em [`src/config/branding.ts`](src/config/branding.ts) (`APP_NAME`, `APP_TAGLINE`, `APP_DOMAIN`) e no `<title>`/meta tags de [`index.html`](index.html) quando o nome final for escolhido. Nada mais no código precisa mudar.

SaaS para escolas gerarem a grade horária automaticamente (turmas × disciplinas × professores), sem
choques de horário. Autenticação e assinaturas rodam de verdade (Supabase + Mercado Pago); turmas,
professores e disciplinas ainda ficam em `localStorage` por usuário (ver "O que ainda é local" abaixo).

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, sem `tailwind.config.js` — tokens em `src/index.css`)
- **React Router v7** — rotas client-side
- **Framer Motion** — animações (login, hero, modal, wizard)
- **lucide-react** — ícones
- **Supabase** — autenticação (`src/context/AuthContext.tsx`) e banco (`profiles`, `subscriptions`) + Edge Functions
- **Mercado Pago** (Assinaturas/Preapproval) — cobrança recorrente, via Edge Functions (ver [`supabase/README.md`](supabase/README.md))

## Como rodar

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Abre em `http://localhost:5173` (ou próxima porta livre).

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build
```

## Login (Supabase Auth)

Autenticação real via Supabase — botão **"Criar conta grátis"** (`/login?modo=cadastro`) cria a conta e
o plano começa em **Teste grátis** (1 turma). Não há mais contas fixas de demonstração. Toda conta nova
nasce com `role: "user"` na tabela `profiles` — a aba **Administração** só aparece pra `role: "admin"`
(hoje só é possível promover alguém editando a linha direto no Supabase, Table Editor → `profiles`).

Precisa rodar a migration antes de logar pela primeira vez — ver
[`migrations/0001_profiles_subscriptions.sql`](migrations/0001_profiles_subscriptions.sql).

## Estrutura do projeto

```
src/
  config/branding.ts         → nome do produto, tagline, planos e preços (fonte única)
  data/mockData.ts           → disciplinas/professores/turmas SEED (local) + tipos
  lib/supabaseClient.ts      → cliente Supabase (usa VITE_SUPABASE_URL/ANON_KEY)
  context/
    AuthContext.tsx          → login/signup/logout via Supabase Auth + perfil (profiles)
    ThemeContext.tsx         → tema claro/escuro, persistido em localStorage
    DataContext.tsx          → turmas/professores/disciplinas (ainda localStorage, ver abaixo)
  lib/scheduleGenerator.ts   → algoritmo que gera a grade evitando conflito de professores
  services/payment.ts        → chama a Edge Function create-subscription (checkout Mercado Pago)
  hooks/useSEO.ts            → title/description/OG/canonical por página (SPA)
  components/                → Navbar, Footer, PlanBadge, ScheduleGrid, NovaTurmaModal...
  components/onboarding/      → wizard de configuração inicial (turmas/matérias/professores/dias)
  components/dashboard/       → gerenciadores de Turmas/Matérias/Professores (pós-onboarding)
  pages/
    LandingPage.tsx           → apresentação/marketing (`/`) + botões de plano (checkout)
    LoginPage.tsx             → login/cadastro (`/login`)
    DashboardPage.tsx         → gerador de horários + navegação lateral (`/app`, protegida)
    PagamentoRetornoPage.tsx  → retorno do checkout do Mercado Pago (`/pagamento/retorno`)
migrations/                  → SQL do banco (rodar no SQL Editor do Supabase)
supabase/functions/          → Edge Functions (create-subscription, mercadopago-webhook)
```

## O que foi feito

### 1. Landing page de apresentação (`/`)
Hero com CTA, seção de problema/recursos/"como funciona", **planos e preços** (toggle mensal/anual,
calculadora de gerações grátis) e CTA final. Botões de plano pago chamam o checkout de verdade
(ver seção de pagamento abaixo); "Começar agora"/"Teste grátis" levam pro cadastro sem passar por
pagamento nenhum — são fluxos propositalmente diferentes.

### 2. Login/cadastro (`/login`)
Tela dividida, animações com Framer Motion. Cadastro cria a conta no Supabase Auth; se vier de um botão
de plano pago (`?plano=bronze`), depois de logar já continua direto pro checkout do Mercado Pago em vez
de cair no painel.

### 3. Wizard de configuração inicial
Conta nova (sem turmas) cai num assistente guiado: quantas turmas → matérias em bloco → professores →
dias da semana → revisão. Só aparece uma vez; depois disso tudo fica editável nas abas do painel.

### 4. Gerador de horários (`/app`, protegida por login)
- Navegação lateral: **Horários** (gerador + grade), **Turmas**, **Matérias**, **Professores**,
  **Administração** (só admin).
- **Limite de turmas de acordo com o plano** do usuário logado (bloqueia criação e mostra CTA de upgrade).
- Editor de carga horária semanal por disciplina (steppers +/-), matérias e professores editáveis a
  qualquer momento (não só no wizard).
- Botão **"Gerar horários"**: roda [`gerarHorarios`](src/lib/scheduleGenerator.ts), um algoritmo guloso
  que distribui as aulas de cada turma pela semana evitando que o mesmo professor seja escalado em duas
  turmas no mesmo horário. Quando não consegue encaixar alguma aula, reporta o conflito em vez de travar.
- Grade visual (dias × horários) colorida por disciplina, **arrastável** (drag-and-drop pra reorganizar
  manualmente), com exportação via impressão do navegador (`window.print()`).
- Plano **Teste grátis**: limitado a 2 gerações a cada 36h (contador na lateral); exportação leva
  marca d'água (só nesse plano).

### 5. Planos, preços e cobrança recorrente
Preços em [`src/config/branding.ts`](src/config/branding.ts) (Bronze R$49,90 / Prata R$99,90 / Ouro
R$179,90 por mês). Cobrança de verdade via **assinatura recorrente do Mercado Pago** (Preapproval API):
o usuário paga uma vez e o Mercado Pago cobra sozinho todo mês, sem ação manual. Ver
[`supabase/README.md`](supabase/README.md) para o fluxo completo e os passos de deploy.

## O que ainda é local (não migrado pro Supabase)

- **Turmas, professores e disciplinas** continuam em `localStorage` por usuário (`horaria_turmas_<id>`
  etc.) — não sincronizam entre dispositivos/navegadores ainda. Migrar isso pro Supabase é o próximo
  passo natural, mas não é necessário pro pagamento funcionar (já usa auth real).
- **SEO "on-page" pronto, mas indexação real depende do domínio final.** Troque `APP_DOMAIN` em
  `branding.ts` (hoje é placeholder), e **também** `public/robots.txt` e `public/sitemap.xml` (arquivos
  estáticos, não seguem o `branding.ts` automaticamente).
- **Sem `og:image`/`twitter:image`** — compartilhar o link ainda não mostra imagem de preview.
- **Sem página 404 real** — qualquer rota desconhecida redireciona pra `/` silenciosamente.
- **Sem Termos de Uso / Política de Privacidade** — recomendado antes de cobrar de verdade.

## Próximos passos sugeridos

1. Rodar a migration e conectar o backend seguindo [`supabase/README.md`](supabase/README.md).
2. Migrar turmas/professores/disciplinas do `localStorage` pro Supabase (tabelas próprias + RLS).
3. Decidir o nome definitivo e o domínio, e atualizar os 3 lugares que hoje têm placeholder
   (`branding.ts`, `robots.txt`, `sitemap.xml`).
4. Gerar uma imagem OG e ícone/favicon definitivos (hoje usa o SVG placeholder do Vite).
5. Escrever Termos de Uso / Política de Privacidade antes de abrir pro público.
