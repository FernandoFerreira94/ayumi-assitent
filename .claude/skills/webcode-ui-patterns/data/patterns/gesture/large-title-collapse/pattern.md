---
id: large-title-collapse
title: Título grande que recolhe na barra
category: gesture
summary: Cabeçalho no estilo iOS: título grande abaixo da barra que, ao rolar, encolhe e passa para o centro da barra de vidro, com a busca recolhendo junto. Feito com scroll-driven animations e fallback com IntersectionObserver.
themes: [aurora, clean-saas, playful]
products: [mobile-app, health, fintech, delivery, booking, ai-app, edtech, field-service]
motion: medium
tech: css-js
deps: []
a11y: Um único h1 (o grande); o título da barra é aria-hidden; nada muda de ordem de foco; a barra mantém área de toque de 44px; reduced motion troca a transição por corte simples.
perf: animation-timeline: scroll() quando suportado (zero JS na rolagem); fallback com um sentinela no IntersectionObserver alternando uma classe; só opacity e transform.
reference_name: Apple HIG (Navigation bars, large titles)
reference_url: https://developer.apple.com/design/human-interface-guidelines/navigation-bars
react: Componente LargeTitleHeader com children; em Next.js, sticky dentro do layout da rota e glass-sticky-header como barra.
status: stable
---

## Quando usar
- Telas principais de app mobile/PWA (abas da tab bar) com listas longas.

## Evite
- Em telas de detalhe ou formulários: use a barra compacta direto.
- Título grande com mais de uma linha.
- Animação ligada à rolagem que muda a altura do documento (pula o scroll).

## Implementação
- O título grande rola normalmente; só a cópia pequena da barra aparece (opacity + translate) quando ele sai.
- Combine com `glass-sticky-header` e `ios-tab-bar`.
