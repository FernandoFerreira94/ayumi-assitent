---
id: logo-cloud-marquee
title: Faixa de logos de clientes
category: section
summary: Prova social em uma faixa de logos que desliza devagar, para no hover e no foco, tem botão de pausa e vira grade estática com movimento reduzido.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista]
products: [landing, saas, institutional, launch, devtools, ai-app, b2b, automation, event]
motion: medium
tech: css-js
deps: []
a11y: A lista real de clientes fica uma vez no DOM; a cópia que fecha o loop é aria-hidden e inerte. Botão Pausar/Continuar visível (WCAG 2.2.2, movimento por mais de 5 s). Pausa no hover e no foco. Com prefers-reduced-motion a faixa vira grade sem animação.
perf: Uma animação de transform em loop no compositor; nenhuma medição em JS. Logos em SVG inline ou img com width/height para não causar CLS.
reference_name: WCAG 2.2 (2.2.2 Pause, Stop, Hide) e faixas de clientes de Vercel e Stripe
reference_url: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
react: Server component com a lista; o botão de pausa é client e só alterna data-paused. Logos em componente com width/height fixos.
status: stable
---

## Quando usar
- Logo abaixo do hero, para responder "quem mais usa isso?" antes de qualquer explicação.
- Quando há 8 ou mais logos reconhecíveis pelo público.

## Evite
- Menos de 6 logos: use uma linha estática.
- Velocidade alta ou logos coloridos: a faixa compete com o hero. Use monocromático com `--wc-fg-muted`.
- Logos de quem não autorizou o uso.

## Implementação
- Trilho com a lista + cópia aria-hidden, `animation: marquee 40s linear infinite` em `translateX(-50%)`.
- `mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)` suaviza as bordas.
- `:hover, :focus-within, [data-paused]` → `animation-play-state: paused`.
- `@media (prefers-reduced-motion: reduce)`: esconde a cópia e troca o trilho por `flex-wrap: wrap` centralizado.
