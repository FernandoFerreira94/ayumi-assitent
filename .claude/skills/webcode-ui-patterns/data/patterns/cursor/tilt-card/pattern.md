---
id: tilt-card
title: Card com inclinação 3D e reflexo
category: cursor
summary: O card inclina na direção do cursor com um reflexo de luz por cima, como um cartão físico. Ideal para produto, plano ou cartão de crédito.
themes: [aurora, clean-saas, cinematografico, brutalista, playful]
products: [fintech, ecommerce, landing, launch, subscription, portfolio]
motion: medium
tech: css-js
deps: []
a11y: Decorativo; desliga em touch e reduced motion. Conteúdo do card é texto real.
perf: transform 3D e opacity apenas. Inclinação máxima de 10° para não distorcer o texto.
reference_name: Apple Card e Stripe (cartões)
reference_url: https://www.apple.com/apple-card/
react: Hook client com ref; reset no pointerleave.
status: stable
---

## Quando usar
- Destacar um objeto "físico": cartão, ingresso, plano premium, capa de produto.

## Evite
- Grades com muitos cards inclinando ao mesmo tempo.

## Implementação
- `--rx` e `--ry` vêm da posição relativa do cursor (-1 a 1) multiplicada pelo ângulo máximo.
- O reflexo é um `radial-gradient` posicionado em `--gx`/`--gy` com `mix-blend-mode: soft-light`.
- Retorno com `--wc-motion-spring-smooth`.
