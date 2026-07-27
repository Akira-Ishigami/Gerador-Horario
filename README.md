# Horária — Gerador de Horário Escolar (protótipo)

> **O nome "Horária" é provisório.** Troque em [`src/config/branding.ts`](src/config/branding.ts) (`APP_NAME`, `APP_TAGLINE`, `APP_DOMAIN`) e no `<title>`/meta tags de [`index.html`](index.html) quando o nome final for escolhido. Nada mais no código precisa mudar.

SaaS para escolas gerarem a grade horária automaticamente (turmas × disciplinas × professores), sem
choques de horário. Este é um **protótipo front-end completo, sem backend** — tudo roda com dados mock
e `localStorage`, pronto para você (no VS Code) plugar API real, banco de dados e Mercado Pago depois.

## Stack

- **React 19 + TypeScript + Vite** (mesma base do Nexla-Site)
- **Tailwind CSS v4** (via `@tailwindcss/vite`, sem `tailwind.config.js` — tokens em `src/index.css`)
- **React Router v7** — rotas client-side
- **Framer Motion** — animações (login, hero, modal)
- **lucide-react** — ícones

Nenhum backend, banco de dados ou serviço externo está conectado. Tudo é mock/local.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173` (ou próxima porta livre).

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build
```

## Login (mock)

Não existe backend/autenticação real — o "login" apenas confere email/senha contra a lista em
[`src/data/mockData.ts`](src/data/mockData.ts) e guarda o usuário logado no `localStorage`.

| Papel | E-mail | Senha | Plano |
|---|---|---|---|
| **Admin** | `akira.vha@gmail.com` | `akira123a` | Ouro (ilimitado) |
| **Usuário** | `coordenador@escola.com` | `demo1234` | Prata (até 25 turmas) |

Na tela de login (`/login`) há botões **"Preencher demo · Admin/Usuário"** que já preenchem essas
credenciais — não precisa decorar. O papel (admin/usuário) aparece identificado no card de preview
do e-mail, no cabeçalho do painel e habilita/esconde a aba **Administração**.

## Estrutura do projeto

```
src/
  config/branding.ts       → nome do produto, tagline, planos e preços (fonte única)
  data/mockData.ts         → usuários, professores, disciplinas e turmas mock
  context/
    AuthContext.tsx        → login/logout mock, persistido em localStorage
    ThemeContext.tsx       → tema claro/escuro, persistido em localStorage
    DataContext.tsx        → CRUD de turmas + regra de limite por plano
  lib/scheduleGenerator.ts → algoritmo que gera a grade evitando conflito de professores
  services/payment.ts      → stub do Mercado Pago (ver seção abaixo)
  hooks/useSEO.ts          → title/description/OG/canonical por página (SPA)
  components/              → Navbar, Footer, ThemeToggle, PlanBadge, ScheduleGrid, NovaTurmaModal...
  pages/
    LandingPage.tsx         → apresentação/marketing (`/`)
    LoginPage.tsx           → login animado (`/login`)
    DashboardPage.tsx       → gerador de horários + painel admin (`/app`, protegida)
```

## O que foi feito

### 1. Landing page de apresentação (`/`)
Hero com CTA, seção de recursos, "como funciona", **planos e preços** (toggle mensal/anual) e CTA final.
SEO básico (meta description, Open Graph, `robots.txt`, `sitemap.xml`, JSON-LD `SoftwareApplication`)
para ajudar o Google a indexar/recomendar a página quando o domínio for publicado — ver seção de SEO
abaixo para o que falta.

### 2. Login animado com identificação de papel (`/login`)
Tela dividida, animações com Framer Motion, atalhos de preenchimento para os dois papéis mock e
indicador do papel (Admin/Usuário) assim que o e-mail digitado bate com um usuário conhecido.

### 3. Gerador de horários (`/app`, protegida por login)
- Cadastro de turmas (nome + turno), com **limite de turmas de acordo com o plano do usuário logado**
  (bloqueia criação e mostra CTA de upgrade ao atingir o limite — testado com Bronze/Prata/Ouro).
- Editor de carga horária semanal por disciplina (steppers +/-).
- Botão **"Gerar horários"**: roda [`gerarHorarios`](src/lib/scheduleGenerator.ts), um algoritmo guloso
  que distribui as aulas de cada turma pela semana evitando que o mesmo professor seja escalado em duas
  turmas no mesmo horário. Quando não consegue encaixar alguma aula, reporta o conflito em vez de travar.
- Grade visual (dias × horários) colorida por disciplina, com exportação via impressão do navegador
  (`window.print()` com CSS dedicado — sem lib extra; "Salvar como PDF" no diálogo de impressão já cobre
  o pedido de exportação em PDF por enquanto).
- Card de **plano atual** (Bronze/Prata/Ouro) com barra de uso de turmas, visual "futurista" (glass +
  gradiente), sempre visível na lateral.
- Aba **Administração** (só para `role: admin`): lista de professores e usuários mock.

### 4. Modo claro/escuro sem flash
Tema padrão segue a preferência do sistema operacional na primeira visita; depois disso, a escolha do
usuário é salva em `localStorage`. Um pequeno script inline no `<head>` de `index.html` aplica a classe
`dark` **antes do primeiro paint**, então não há flash de tema errado ao recarregar a página.

### 5. Planos e preços (pesquisa de mercado — jul/2026)
Pesquisei concorrentes diretos (Brasil e internacional) antes de definir os valores:

- **PowerCubus** (BR): planos Standard/Advanced/Premium + gratuito até 3 turmas.
- **GridClass** (BR): a partir de **R$ 1.399/ano** (~R$ 116/mês) para até 20 turmas.
- **Schedula** / **Timetabling Turbo** (internacional): US$ 5–30/mês.

Com base nisso, os 3 planos ficaram assim (definidos em [`src/config/branding.ts`](src/config/branding.ts)):

| Plano | Turmas | Mensal | Anual |
|---|---|---|---|
| Bronze | até 10 | R$ 49,90 | R$ 499 (~2 meses grátis) |
| Prata | até 25 | R$ 99,90 | R$ 999 |
| Ouro | ilimitado | R$ 179,90 | R$ 1.799 |

Posicionamos abaixo do GridClass no tier de entrada/intermediário para ganhar mercado, e o Ouro compete
no mesmo patamar dos planos avançados dos concorrentes brasileiros. **Ajuste esses números livremente**
— é só um ponto de partida validado por mercado, não uma verdade absoluta.

### 6. Preparado para o Mercado Pago (ainda não conectado)
[`src/services/payment.ts`](src/services/payment.ts) centraliza toda chamada de checkout por trás de
`createCheckoutSession(planId)`, que hoje só simula a chamada (mock, sem cobrança real). Quando for
integrar:

1. Criar credenciais em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers).
2. Preencher `VITE_MERCADOPAGO_PUBLIC_KEY` num `.env` (veja `.env.example`).
3. Criar um backend simples que gere a preferência de pagamento (`POST /api/checkout { planId }` →
   `{ initPoint }`) — o Mercado Pago exige que a preferência seja criada no servidor, com a *access
   token* privada, nunca no front.
4. Trocar o corpo de `createCheckoutSession` para chamar esse endpoint e redirecionar para `initPoint`.

Nenhum outro lugar do app precisa mudar — todos os botões de plano já chamam essa mesma função.

## O que NÃO está implementado (de propósito)

- **Sem backend/banco de dados.** Usuários, professores, disciplinas e turmas são mock
  (`src/data/mockData.ts`); as turmas que você cria/edita ficam só no `localStorage` do seu navegador,
  por usuário logado (`horaria_turmas_<id>`).
- **Sem cobrança real** — ver seção do Mercado Pago acima.
- **SEO "on-page" pronto, mas indexação real depende do domínio final.** Troque `APP_DOMAIN` em
  `branding.ts`, gere uma imagem para `og:image` (hoje não há uma), e submeta o `sitemap.xml` no Google
  Search Console assim que o domínio for publicado.

## Próximos passos sugeridos

1. Decidir o nome definitivo e trocar em `branding.ts` + `index.html`.
2. Escolher e conectar um backend (ex: Supabase/Node) para turmas, professores e usuários reais.
3. Trocar `AuthContext` por autenticação real (mantendo a mesma interface `useAuth()` — os componentes
   não precisam mudar).
4. Conectar o Mercado Pago seguindo os passos da seção acima.
5. Gerar uma imagem OG e ícone/favicon definitivos (hoje usa o SVG placeholder do Vite).
