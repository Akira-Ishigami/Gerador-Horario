# Images

Logo definitiva, `og:image` e outras fotos/artes do produto entram aqui.

O favicon fica direto em `public/favicon.ico` (não aqui em `images/`) — é referenciado
por `<link rel="icon" href="/favicon.ico">` no `index.html`. Pra trocar, é só
substituir o arquivo mantendo esse mesmo nome.

Ainda falta uma `og:image` (imagem que aparece ao compartilhar o link em
redes sociais/WhatsApp) — quando tiver, referencie em `src/hooks/useSEO.ts`.
