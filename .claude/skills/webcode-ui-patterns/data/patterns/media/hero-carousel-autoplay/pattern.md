---
id: hero-carousel-autoplay
title: Carrossel com scroll-snap e autoplay pausável
category: media
summary: Carrossel de destaques com rolagem nativa (scroll-snap), setas, indicadores e autoplay que pausa no hover, no foco e com a aba oculta, sempre com botão de pausa. Arrasto e inércia são do navegador.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [landing, ecommerce, marketplace, subscription, event, launch, institutional, delivery]
motion: medium
tech: css-js
deps: []
a11y: Região com aria-roledescription="carrossel" e slides "2 de 5"; botão de pausa sempre visível (WCAG 2.2.2); aria-live "off" enquanto gira e "polite" quando parado; setas e pontos são botões com nome; ← → Home End no teclado; começa parado com movimento reduzido.
perf: Sem biblioteca; scroll-snap faz o arrasto em 60fps; slide atual calculado no scroll com requestAnimationFrame; nada anima fora da tela (pausa com document.hidden).
reference_name: W3C WAI — Carousel tutorial
reference_url: https://www.w3.org/WAI/tutorials/carousels/
react: "`npx shadcn add @webcode/carousel`: mesma API do shadcn (sem embla) com `autoplay`, `opts.loop` e `CarouselDots`."
status: stable
---

## Quando usar
- Destaques de home, banners de campanha, vitrine de categorias, depoimentos.

## Evite
- Autoplay sem botão de pausa ou abaixo de 5s.
- Informação crítica só no 3º slide: quase ninguém chega lá.
- Setas fora da área no celular (geram rolagem lateral).

## Implementação
- `overflow-x: auto; scroll-snap-type: x mandatory` no trilho e `scroll-snap-align: start` no slide; esconda a barra.
- Indicadores = posições possíveis (com 3 por vez, 5 slides dão 3 pontos).
- Pausa = intenção do usuário (botão) + pausas momentâneas (hover, foco, aba oculta).
