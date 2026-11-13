---
id: anchored-popover
title: Popover ancorado nativo (Popover API + anchor positioning)
category: overlay
summary: Filtro em popover que abre ancorado ao botão, vira para cima quando falta espaço e fecha com Esc ou clique fora, sem JavaScript de posicionamento nem biblioteca.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, ecommerce, marketplace, helpdesk, logistics, automation, b2b, booking, realestate]
motion: low
tech: css-js
deps: []
a11y: popovertarget liga o botão ao painel e expõe aria-expanded sozinho; Esc e clique fora fecham (light dismiss) e o foco volta ao botão; não prende o foco, porque não é modal; o painel tem rótulo por aria-labelledby.
perf: Posição resolvida pelo CSS (anchor() e position-try-fallbacks), sem medir layout em JS. Entrada com @starting-style só em opacity e scale. Fallback em JS apenas quando o navegador não suporta anchor positioning.
reference_name: MDN (Popover API e CSS anchor positioning)
reference_url: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
react: Use @webcode/popover (Radix), que já escala a partir do gatilho. Em projetos sem React, este padrão substitui Floating UI.
status: stable
---

## Quando usar
- Filtros rápidos acima de tabelas, seletor de colunas, escolha de período, mini formulários de até 3 campos.
- Qualquer menu ou painel que precisa ficar preso ao botão que o abriu.

## Evite
- Conteúdo longo ou formulários: use sheet ou dialog.
- Informação essencial que só aparece no hover (popover abre por clique).
- Popover dentro de popover.

## Implementação
- `<button popovertarget="id">` + `<div popover id="id">`: o navegador cuida de abrir, fechar, Esc, clique fora e camada superior.
- `anchor-name` no botão e `position-anchor` + `top: anchor(bottom)` no painel; `position-try-fallbacks: flip-block, flip-inline` vira quando não cabe.
- `transform-origin` no lado do gatilho; escala .96 → 1 em `fast`, saída em `instant`.
- Contagem de filtros ativos atualiza o rótulo do botão ("Status · 2") para não depender do painel aberto.
