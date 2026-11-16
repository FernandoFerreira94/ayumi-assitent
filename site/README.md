# Site de apresentação (bubbly.app.br)

HTML/CSS estático em `public/`, servido pelo Caddy (`Caddyfile`, `Dockerfile`).

- Railway: serviço `bubbly-site` (projeto do app). Root Directory `/site`, watch `/site/**`,
  start `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile`, healthcheck `/`.
  As configurações ficam no serviço (o `railway.json` da raiz do repo é do app e não vale aqui).
- Domínios: `bubbly.app.br` e `www.bubbly.app.br` (www redireciona para o raiz no Caddy). DNS na Cloudflare, nuvem cinza.
- Botões apontam para `https://app.bubbly.app.br`. Privacidade e Termos são as páginas do app.
- Prévia local: `python3 -m http.server -d site/public 8080`.
