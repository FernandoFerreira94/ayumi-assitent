---
id: pagination-numbered
title: Paginação numerada com resumo e versão compacta
category: navigation
summary: Paginação com primeira, última e vizinhas em posições fixas (a barra não muda de largura), resumo "1–50 de 1.240" e, no celular, "3 de 12" entre as setas.
themes: [clean-saas, aurora, editorial, brutalista]
products: [saas, erp, crm, admin, helpdesk, ecommerce, marketplace, editorial, logistics, b2b]
motion: none
tech: css-js
deps: []
a11y: nav com aria-label; página atual com aria-current="page"; setas com nome ("Ir para a próxima página") e desabilitadas nas pontas; resumo em aria-live; botões de 40px (44px no toque).
perf: Só re-renderiza a faixa; com URL por página (?page=3) o navegador guarda o histórico e o SEO indexa.
reference_name: GOV.UK Design System — Pagination
reference_url: https://design-system.service.gov.uk/components/pagination/
react: "`npx shadcn add @webcode/pagination`: Paginator (numbered/simple, onPageChange ou getHref) + PaginationSummary + getPageRange."
status: stable
---

## Quando usar
- Tabelas e listas onde o usuário volta a um ponto (pedidos, clientes, resultados de busca, blog).

## Evite
- Rolagem infinita em tabela de backoffice (perde a posição e o rodapé).
- Reticências que mudam de lugar a cada clique (a barra "dança").
- Números pequenos demais no toque.

## Implementação
- Sempre 2·vizinhas + 5 posições: `1 … 4 5 6 … 25`, perto das pontas `1 2 3 4 5 … 25`.
- Paginação no servidor com `page` na URL; o resumo usa tabular-nums.
