---
id: transparent-hero-header
title: Header transparente sobre imagem que fica sólido
category: header
summary: Header com texto claro sobre a foto ou vídeo do hero; quando o hero sai da tela, ganha superfície sólida e cores do tema. Para sites onde a imagem vende.
themes: [aurora, editorial, clean-saas, cinematografico]
products: [landing, institutional, realestate, portfolio, event, booking, launch]
motion: low
tech: css-js
deps: []
a11y: Sobre a imagem, um degradê escuro no topo garante contraste AA do texto branco em qualquer foto. A troca de estado não move o foco nem o layout. Skip link incluso.
perf: IntersectionObserver num sentinela no fim do hero; zero cálculo por scroll. Só cor, fundo e borda transitam.
reference_name: Airbnb Luxe e sites de hotelaria
reference_url: https://www.airbnb.com/luxury
react: Client component pequeno: useRef no sentinela + IntersectionObserver em useEffect; data-solid no header.
status: stable
---

## Quando usar
- Hero com fotografia ou vídeo forte: imobiliário, turismo, eventos, institucional premium.

## Evite
- Texto branco direto sobre foto sem degradê de proteção: falha contraste em fotos claras.
- Usar em páginas sem hero de imagem: o header nasceria invisível sobre fundo claro.

## Implementação
- Header `position: fixed` com `data-solid="false"`; um `::before` com `linear-gradient` de `--wc-color-black` a transparente protege o texto.
- Sentinela de 1px no fim do hero; quando sai da viewport, `data-solid="true"` troca fundo para `--wc-surface`, texto para `--wc-fg` e mostra a borda.
- Logo em `currentColor` (SVG) para acompanhar a troca sem duas versões.
- Botão de CTA muda de "vidro claro" para `--wc-accent-solid`.
