---
id: view-transition-morph
title: Transição com morph entre lista e detalhe
category: page-transition
summary: A imagem do card cresce e vira o topo da página de detalhe, com a View Transitions API nativa. A navegação parece física, sem biblioteca.
themes: [aurora, clean-saas, editorial, cinematografico]
products: [ecommerce, marketplace, realestate, portfolio, booking, mobile-app, editorial]
motion: medium
tech: css-js
deps: []
a11y: Foco vai para o título do detalhe e volta para o card de origem. Reduced motion faz troca instantânea. Botão Voltar real.
perf: O navegador tira snapshots e anima no compositor. Sem suporte, a troca é imediata e funcional.
reference_name: Chrome for Developers (View Transitions)
reference_url: https://developer.chrome.com/docs/web-platform/view-transitions
react: Next.js tem suporte experimental (viewTransition no next.config) e React 19.2 traz <ViewTransition>. Para MPA use @view-transition { navigation: auto }.
status: stable
---

## Quando usar
- Lista → detalhe em e-commerce, imóveis, portfolio e galerias.

## Evite
- Morph de elementos com proporções muito diferentes (o texto distorce). Morph imagem com imagem, título com título.
- Duração acima de 400ms.

## Implementação
- Antes da troca, o card clicado recebe `view-transition-name: hero` e o título `title`. No detalhe, os mesmos nomes ficam nos elementos equivalentes.
- `document.startViewTransition(() => render())`. Sem suporte: só `render()`.
- `::view-transition-group(*)` recebe duração e curva dos tokens.
