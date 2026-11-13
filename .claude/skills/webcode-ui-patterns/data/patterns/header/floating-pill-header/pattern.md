---
id: floating-pill-header
title: Header flutuante em pílula com destaque que desliza
category: header
summary: Navegação em cápsula de vidro solta do topo, com um destaque que desliza até o link sob o mouse ou foco e volta ao item ativo. Compacta ao rolar.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [portfolio, landing, launch, ai-app, devtools, event]
motion: medium
tech: css-js
deps: []
a11y: O destaque é decorativo (aria-hidden) e segue também o foco do teclado. aria-current marca a página. Abaixo de 600px vira pílula com logo, CTA e menu disclosure.
perf: O destaque se move com translate e width medidos uma vez por evento (sem layout por frame). Compactação por animation-timeline scroll(), sem JS de scroll.
reference_name: Raycast e Vercel (abas com destaque deslizante)
reference_url: https://www.raycast.com
react: Guarde o retângulo do item em estado e aplique com style; ou use layoutId do Motion se o projeto já tiver Motion. Sem Motion, este demo é a referência.
status: stable
---

## Quando usar
- Sites de produto e portfólios com 3 a 5 links, onde o header também é peça de marca.

## Evite
- Mais de 6 links: a pílula fica larga demais e perde o efeito.
- Destaque que só segue o mouse: teclado também precisa ver onde está.

## Implementação
- `position: fixed; left: 50%; translate: -50% 0` com `max-width` e margem do topo.
- Um `<span>` absoluto recebe `--x` e `--w` do link (`offsetLeft`/`offsetWidth`) em `pointerover` e `focusin`; ao sair, volta ao `aria-current`.
- Transição em `--wc-motion-spring-snappy`; reduced motion troca para mudança instantânea.
- `animation-timeline: scroll()` reduz padding e aumenta a opacidade do vidro nos primeiros 120px.
