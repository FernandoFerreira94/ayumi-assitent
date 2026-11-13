---
id: footer-saas-columns
title: Footer SaaS multi-coluna com status e preferências
category: footer
summary: Footer completo de produto: marca e frase, quatro colunas de links, indicador de status do sistema, seletor de idioma, troca de tema e redes. No mobile, as colunas viram sanfonas nativas.
themes: [clean-saas, aurora, editorial]
products: [saas, devtools, ai-app, automation, fintech, landing, b2b]
motion: low
tech: css-js
deps: []
a11y: Landmark footer (contentinfo); cada coluna é nav com aria-labelledby no título. No mobile usa details/summary (teclado e leitor nativos). Status traz texto, não só cor. Ícones sociais com nome acessível. Troca de tema é radiogroup.
perf: Sem JS para o layout; um matchMedia abre as sanfonas no desktop. Ícones em SVG inline (sem fonte de ícones).
reference_name: Vercel, Linear e Stripe (footers de produto)
reference_url: https://vercel.com
react: Server component; só o seletor de tema é client (next-themes). Status vem de uma API leve com revalidate de 60s.
status: stable
---

## Quando usar
- Site de produto SaaS e documentação: o footer vira mapa do site.

## Evite
- Mais de 5 colunas ou de 7 links por coluna.
- Repetir o menu principal inteiro sem agrupar.

## Implementação
- `grid-template-columns: 1.4fr repeat(4, 1fr)`; abaixo de 720px, uma coluna com `<details>` por grupo.
- No desktop, `details` ficam `open` e o `summary` deixa de ser clicável (`pointer-events: none`), sem duplicar markup.
- Status: ponto com `--wc-success` e texto "Todos os sistemas operando", link para a página de status.
- Linha final com © e links legais; quebra em duas linhas no mobile.
