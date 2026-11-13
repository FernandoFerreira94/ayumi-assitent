---
id: hide-on-scroll-header
title: Header que esconde ao descer e volta ao subir
category: header
summary: Header fixo que sai de cena quando a pessoa rola para baixo (mais área de leitura) e reaparece no primeiro gesto para cima. Ideal para leitura longa e mobile.
themes: [editorial, clean-saas, aurora, cinematografico, brutalista]
products: [editorial, ecommerce, institutional, edtech, mobile-app, devtools]
motion: low
tech: css-js
deps: []
a11y: Nunca esconde com foco dentro (Tab sempre encontra o header). Fica visível no topo da página e quando há menu aberto. Landmark header com nav rotulado.
perf: Um listener de scroll passivo com requestAnimationFrame; só alterna uma classe. A animação é translate (compositor). Limiar de 8px evita tremer em trackpad.
reference_name: Medium e Safari iOS (barras que recolhem)
reference_url: https://medium.com
react: Hook useScrollDirection (ref + rAF) devolvendo "up" | "down"; aplique data-hidden no header. Desligue em rotas de app com sidebar.
status: stable
---

## Quando usar
- Artigos, documentação, listagens longas e lojas no mobile, onde cada pixel vertical conta.

## Evite
- Telas de app com ações primárias no header (salvar, filtrar): a pessoa precisa delas o tempo todo.
- Esconder sem limiar: microrrolagens fazem o header piscar.

## Implementação
- Compare `scrollY` com o último valor dentro de `requestAnimationFrame`; só troque o estado quando a diferença passar de 8px.
- Mantenha visível enquanto `scrollY < altura do header`, com `:focus-within` e com qualquer menu aberto.
- `translate: 0 -100%` com `--wc-motion-ease-in` ao sair e `--wc-motion-ease-out` ao voltar. Em reduced motion, a troca é instantânea.
- Uma sombra só aparece depois do topo, para separar do conteúdo.
