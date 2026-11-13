---
id: glass-sticky-header
title: Header de vidro que compacta no scroll
category: header
summary: Header transparente no topo que ganha vidro, borda e altura menor depois de 80px de rolagem. Sem JavaScript.
themes: [aurora, clean-saas, editorial, cinematografico]
products: [landing, saas, ecommerce, institutional, devtools, ai-app, editorial, booking, delivery, event, health, helpdesk, launch, marketplace, portfolio, realestate, subscription]
motion: low
tech: css
deps: []
a11y: Landmark header com nav rotulado. Link "pular para o conteúdo" incluído. Em reduced transparency o vidro vira sólido pelo token.
perf: animation-timeline scroll() roda no compositor. Fallback sem suporte mostra o estado de vidro direto.
reference_name: Apple HIG (Materials) e barra global do apple.com
reference_url: https://developer.apple.com/design/human-interface-guidelines/materials
react: Server component. Só o menu mobile precisa de estado client.
status: stable
---

## Quando usar
- Qualquer site com rolagem longa. É o header padrão WebCode.

## Evite
- Header mais alto que 64px no desktop ou que esconde ao rolar para baixo em sites com pouca navegação (atrapalha mais que ajuda).

## Implementação
- `animation-timeline: scroll()` com `animation-range: 0 80px` interpola fundo, borda e padding.
- Fora do `@supports`, o header já nasce com vidro: degrada sem quebrar.
- Use `top: env(safe-area-inset-top)` em PWA/iOS.
