---
id: product-gallery
title: Galeria de produto com miniaturas e zoom
category: commerce
summary: Galeria com imagem principal deslizável por scroll-snap (swipe nativo no toque), miniaturas sincronizadas, setas, contador "2 de 5", zoom ao clicar em dialog e navegação por teclado. Sem biblioteca de carrossel.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [ecommerce, marketplace, realestate, booking, subscription, delivery]
motion: low
tech: css-js
deps: []
a11y: Região com aria-roledescription="galeria" e cada slide "Imagem 2 de 5"; miniaturas são botões com aria-current; setas ←/→ quando a galeria tem foco; zoom em <dialog> que fecha com Esc e devolve o foco.
perf: scroll-snap nativo e IntersectionObserver para saber o slide atual (sem listener de scroll pesado); imagens reais com loading="lazy" exceto a primeira, aspect-ratio fixo para não haver CLS.
reference_name: Baymard Institute (Product page image gallery)
reference_url: https://baymard.com/blog/ensure-sufficient-image-resolution-and-zoom
react: "`npx shadcn add @webcode/carousel @webcode/image-viewer`: Carousel (scroll-snap, sem embla) + ImageViewer com zoom e pinça; miniaturas com CarouselDots ou setApi."
status: stable
---

## Quando usar
- Página de produto, imóvel, quarto de hotel: o usuário precisa examinar fotos.

## Evite
- Autoplay na galeria de produto.
- Esconder a contagem: o usuário quer saber quantas fotos há.
- Zoom por hover como único caminho (não existe no toque).

## Implementação
- Proporção fixa (1:1 ou 4:5) para todas as fotos; vídeo como último slide com poster.
- No mobile, miniaturas viram pontos ou somem, ficando o contador.
