---
id: fullscreen-menu-overlay
title: Menu hambúrguer que abre em tela cheia
category: navigation
summary: Ícone de hambúrguer que vira X e abre um menu de tela inteira com revelação circular a partir do botão e links grandes entrando em cascata. Para portfólios, agências e marcas.
themes: [editorial, aurora, clean-saas, cinematografico, brutalista]
products: [portfolio, landing, event, launch, institutional, editorial]
motion: high
tech: css-js
deps: []
a11y: Menu é um dialog modal nativo (showModal): prende o foco, Esc fecha e o foco volta ao botão. O botão muda de nome ("Abrir menu" / "Fechar menu") e fica acima do overlay. Em reduced motion, revelação vira fade e links aparecem sem deslocamento.
perf: Revelação com clip-path circle() e translate nos links (compositor). Raio calculado uma vez a partir da posição do botão. Nada roda com o menu fechado.
reference_name: Sites de agências premiados (Awwwards) e menu de navegação do Stripe Press
reference_url: https://www.awwwards.com
react: Use <dialog> com ref (ou Dialog do shadcn com overlay customizado). Defina --cx/--cy/--r em style ao abrir. Em Next, feche no evento de navegação do router.
status: stable
---

## Quando usar
- Sites com poucos links (até 6) onde o menu também é momento de marca.
- Como menu mobile de sites institucionais com pegada editorial.

## Evite
- Apps e sites com navegação frequente: dois cliques para trocar de seção cansam.
- Esconder o menu em hambúrguer no desktop quando os links cabem na barra.

## Implementação
- `dialog` em tela cheia; `clip-path: circle(0 at var(--cx) var(--cy))` → `circle(var(--r) ...)` com `@starting-style` e `transition-behavior: allow-discrete`.
- Links com `transition-delay: calc(var(--i) * var(--wc-motion-duration-stagger))`.
- O botão hambúrguer vive dentro do dialog também (cópia visual na mesma posição) para continuar clicável sobre o overlay.
- Ícone: duas barras com `rotate` e `translate`; não troque o SVG.
