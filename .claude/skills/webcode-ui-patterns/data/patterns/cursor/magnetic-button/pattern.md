---
id: magnetic-button
title: Botão magnético
category: cursor
summary: O CTA é atraído pelo cursor quando ele se aproxima e volta com mola ao sair. O rótulo se move mais que o fundo, criando profundidade.
themes: [aurora, editorial, cinematografico, brutalista]
products: [landing, portfolio, launch, event]
motion: medium
tech: css-js
deps: []
a11y: Desligado em touch e em reduced motion. O botão continua sendo um link/botão nativo com foco visível.
perf: Escreve só transform via custom properties dentro de requestAnimationFrame. Uma instância por página.
reference_name: Sites premiados no Awwwards (agências)
reference_url: https://www.awwwards.com
react: Hook useMagnetic(ref, strength). Evite estado React no pointermove.
status: stable
---

## Quando usar
- No CTA principal de páginas de marca, portfolio ou lançamento. Um por página.

## Evite
- Em formulários, dashboards e e-commerce: o botão "fugindo" atrapalha a precisão.
- Força acima de 0.4: vira brincadeira.

## Implementação
- Área de atração maior que o botão (`--reach`), calculada a partir do centro.
- Na saída, a transição usa `--wc-motion-spring-bouncy` para o retorno elástico.
