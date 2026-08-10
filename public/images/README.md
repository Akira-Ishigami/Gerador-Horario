# Images

Logo definitiva, `og:image` e outras fotos/artes do produto entram aqui.

- `icon.png` — a marca (M com check). Usada como favicon (`index.html`) e como o
  selo ao lado do nome no header (`Navbar.tsx`, `Footer.tsx`, `LoginPage.tsx`,
  `OnboardingWizard.tsx`, `DashboardPage.tsx`) — todos apontam pro mesmo arquivo,
  então trocar aqui atualiza em todo lugar de uma vez.
- `public/favicon.ico` continua como reserva pra navegador/SO antigo que não
  entende favicon em PNG.

Ainda falta uma `og:image` (imagem que aparece ao compartilhar o link em
redes sociais/WhatsApp) — quando tiver, referencie em `src/hooks/useSEO.ts`.
