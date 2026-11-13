---
id: scroll-reveal-stagger
title: Revelação em cascata ao rolar
category: enter-exit
summary: Blocos sobem e aparecem em sequência conforme entram na tela, ligados ao scroll pelo CSS. Para seções de features, depoimentos e números.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista]
products: [landing, institutional, saas, portfolio, launch, ecommerce, editorial, event, realestate, subscription]
motion: medium
tech: css
deps: []
a11y: Conteúdo visível sem JS e sem suporte. Em reduced motion nada se move.
perf: animation-timeline view() roda no compositor. Sem IntersectionObserver, sem JS.
reference_name: Chrome for Developers (scroll-driven animations)
reference_url: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
react: Server component. Para Safari antigo, aceite o fallback estático; não adicione JS só por isso.
status: stable
---

## Quando usar
- Seções abaixo da dobra em páginas de marketing.

## Evite
- No conteúdo acima da dobra (atrasa o LCP percebido) e em apps/dashboards.
- Deslocamento maior que 24px.

## Implementação
- `animation-range: entry 10% cover 30%` faz o item terminar de aparecer antes do meio da tela.
- A cascata vem de `animation-range-start` levemente diferente por coluna (`--i`).
- Tudo dentro de `@supports (animation-timeline: view())` e `prefers-reduced-motion: no-preference`.
