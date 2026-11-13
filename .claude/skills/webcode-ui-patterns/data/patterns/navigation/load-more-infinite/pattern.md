---
id: load-more-infinite
title: Carregar mais e rolagem infinita com saída
category: navigation
summary: Lista que cresce sob demanda, com "Mostrando 24 de 120" e barra de progresso. A rolagem infinita carrega sozinha algumas vezes e depois vira botão, para o rodapé continuar alcançável.
themes: [aurora, clean-saas, editorial, brutalista]
products: [ecommerce, marketplace, editorial, delivery, realestate, mobile-app, portfolio, ai-app]
motion: low
tech: css-js
deps: []
a11y: Contagem em aria-live; aria-busy na lista enquanto carrega; botão real "Carregar mais" sempre disponível como alternativa; fim explícito ("Você chegou ao fim"); foco vai ao primeiro item novo depois de carregar pelo botão.
perf: IntersectionObserver com rootMargin de 400px (carrega antes de chegar); sem listener de scroll; itens novos sem reflow dos antigos.
reference_name: Nielsen Norman Group — Infinite Scrolling
reference_url: https://www.nngroup.com/articles/infinite-scrolling-tips/
react: "`npx shadcn add @webcode/load-more`: LoadMore (botão + progresso) e InfiniteScroll (autoLoads, rootMargin)."
status: stable
---

## Quando usar
- Feeds, vitrines e galerias onde a ordem importa pouco e o usuário explora.

## Evite
- Rolagem infinita sem limite em página com rodapé (contato, políticas ficam inalcançáveis).
- Esconder quanto falta: mostre "24 de 120".
- Em tabela de backoffice: use paginação numerada.

## Implementação
- Sentinela observada no fim da lista; após N cargas automáticas (3), troque por botão.
- Ao carregar pelo botão, mova o foco para o primeiro item novo.
