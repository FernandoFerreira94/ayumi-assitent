# Site de apresentação (bubbly.app.br)

HTML/CSS estático em `public/`, servido pelo Caddy (`Caddyfile`, `Dockerfile`).

- Railway: serviço `bubbly-site` (projeto do app). Root Directory `/site`, watch `/site/**`,
  start `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`, healthcheck `/`.
  Essas configurações estão em `.railway/railway.ts` (aplicadas com `railway config apply`).
- Domínios: `bubbly.app.br` e `www.bubbly.app.br` (www redireciona para o raiz no Caddy). DNS na Cloudflare, nuvem cinza.
- Botões apontam para `https://app.bubbly.app.br`.
- **Privacidade e Termos moram aqui** (`public/privacidade.html`, `public/termos.html`, estilo `css/legal.css`). O app redireciona `/privacidade` e `/termos` para cá (`next.config.ts`). São as URLs do Branding do Google OAuth: integração, escopo ou dado novo => atualizar o texto (seção 5 da privacidade = dados do Google, Uso Limitado).
- Seção `#sobre` da página inicial explica a finalidade e o uso do Google (exigência da verificação da marca). O nome em texto é sempre "Bubbly" (o logotipo continua minúsculo).
- Prévia local: `python3 -m http.server -d site/public 8080`.

## Página (18/11/2026)
- `public/index.html`: topo com a Bolha (gira, se divide nas 4 funções e mergulha no celular), dia corrido 07:00→23:47 com conversas e números, 3 passos, "Muito além do lembrete", vídeos e dúvidas. Valores e nomes são exemplos.
- Animações: GSAP 3.12.5 + ScrollTrigger e Lenis 1.1.13 servidos daqui (`public/js/`), porque a CSP só aceita script do próprio site. `js/bolha.js` desenha a Bolha (mesmo traço do `Mascot.tsx`).
- Vídeos em `public/video/` (720p, gerados dos reels da Bolha). Quem pede menos movimento vê a página sem animação.
- Fonte das pranchas: `/mnt/project-files/site-pranchas/` (projeto Claude).
