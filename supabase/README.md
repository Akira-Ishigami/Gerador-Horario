# Backend (Supabase + Mercado Pago)

Passos pra colocar o pagamento de verdade no ar. Tudo aqui roda uma vez só
(ou toda vez que você mudar o código das funções).

## 1. Rodar a migration do banco

Já feito? Se ainda não: abra
https://supabase.com/dashboard/project/ejznysacrspuamnpfetb/sql/new, cole o
conteúdo de [`../migrations/0001_profiles_subscriptions.sql`](../migrations/0001_profiles_subscriptions.sql)
e clique em **Run**. Isso cria as tabelas `profiles` e `subscriptions`.

## 2. Instalar a CLI do Supabase

```bash
npm install -g supabase
```

## 3. Login e conectar ao seu projeto

```bash
supabase login
supabase link --project-ref ejznysacrspuamnpfetb
```

O `login` abre o navegador pra você autorizar — só você consegue fazer esse
passo (precisa da sua conta Supabase).

## 4. Configurar os segredos das funções

```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
supabase secrets set APP_URL=https://SEU-DOMINIO-AQUI.com
```

⚠️ Use o **Access Token** de produção do Mercado Pago (não a Public Key —
essa já está no `.env` do frontend). Enquanto estiver testando, pode usar o
Access Token de teste (`TEST-...`).

`APP_URL` deve ser a URL onde o site está publicado (sem barra no final) —
é pra onde o Mercado Pago redireciona depois do checkout
(`{APP_URL}/pagamento/retorno`). Em desenvolvimento local o padrão já é
`http://localhost:5173`, não precisa configurar pra testar localmente.

## 5. Deploy das duas funções

```bash
supabase functions deploy create-subscription
supabase functions deploy mercadopago-webhook --no-verify-jwt
```

O `--no-verify-jwt` no webhook é obrigatório — o Mercado Pago chama essa URL
diretamente, sem token do Supabase.

## 6. Cadastrar o webhook no Mercado Pago

No painel do Mercado Pago (Suas integrações → a aplicação → Webhooks),
cadastre a URL:

```
https://ejznysacrspuamnpfetb.supabase.co/functions/v1/mercadopago-webhook
```

Evento: **Assinaturas** (`subscription_preapproval`).

## 7. Testar de ponta a ponta

1. Crie uma conta pelo site (`/login?modo=cadastro`).
2. Clique em "Escolher {plano}" numa das opções pagas.
3. Deve abrir o checkout do Mercado Pago. Pague com um
   [cartão de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards).
4. Você volta pro site em `/pagamento/retorno` — ele fica checando o plano
   por até ~20s e redireciona pro painel assim que o webhook confirmar.
5. Confira na tabela `subscriptions` (Supabase → Table Editor) se a linha
   apareceu com `status = authorized` e se `profiles.plan` mudou pro plano
   escolhido.

Se não confirmar: veja os logs da função em
Supabase → Edge Functions → mercadopago-webhook → Logs, e confira se o
webhook foi cadastrado com a URL certa no Mercado Pago.

## O que eu não fiz (e não consigo fazer sem você)

- **Rodar a migration SQL** — só você tem acesso ao SQL Editor do seu projeto.
- **`supabase login`** — abre um fluxo de OAuth no navegador, precisa da sua conta.
- **Configurar as secrets e fazer o deploy das funções** — precisa do login acima.
- **Cadastrar a URL do webhook no painel do Mercado Pago** — ação manual lá.
- **Testar um pagamento de verdade** — só você tem a conta Mercado Pago pra isso.

Todo o código (migration, Edge Functions, frontend) já está pronto — falta só
rodar esses passos manuais com suas próprias credenciais.
