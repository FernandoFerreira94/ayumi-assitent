---
id: sortable-data-table
title: Tabela de dados densa com ordenação
category: data
summary: Tabela semântica com cabeçalho fixo, colunas numéricas à direita com tabular-nums, ordenação acessível (aria-sort) e alternância de densidade compacta/padrão/confortável lembrada por usuário.
themes: [clean-saas]
products: [erp, saas, crm, admin, helpdesk, logistics, b2b, fintech]
motion: none
tech: css-js
deps: []
a11y: table com caption, th scope="col" e scope="row"; botões de ordenação dentro do th com aria-sort no th; resultado anunciado em role="status"; densidade em radiogroup nativo; nada anima ao reordenar.
perf: Ordena o array e reescreve só o tbody; cabeçalho sticky em CSS; para milhares de linhas, virtualize (TanStack Virtual) mantendo a mesma marcação.
reference_name: NN/g (Data Tables) e WAI-ARIA APG (Sortable Table)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/
react: Use @webcode/table (já tem density) + TanStack Table para ordenação, com getSortedRowModel e aria-sort no TableHead.
status: stable
---

## Quando usar
- Listas operacionais: pedidos, lançamentos, tickets, estoque, contatos.

## Evite
- Animação de linhas ao ordenar.
- Zebra e bordas ao mesmo tempo.
- Ordenar por coluna que não tem ordem útil (ex.: descrição longa).

## Implementação
- Primeira coluna identifica a linha e é `th scope="row"`.
- Clique alterna asc → desc; a coluna ordenada mostra seta e `aria-sort`; as outras ficam `none`.
- Densidade por `data-density` no `table` (32/40/52px), salva em `localStorage` com try/catch.
- Números e datas à direita, status com texto + cor.
