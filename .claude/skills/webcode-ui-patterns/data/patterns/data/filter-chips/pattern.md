---
id: filter-chips
title: Filtros ativos em chips com busca e URL
category: data
summary: Busca com debounce e filtros aplicados mostrados como chips removíveis acima da lista, com contagem de resultados, "Limpar tudo" e estado salvo na URL para compartilhar e sobreviver ao F5.
themes: [clean-saas, aurora, editorial, brutalista, playful]
products: [saas, erp, crm, admin, ecommerce, marketplace, helpdesk, logistics, realestate, b2b, pos]
motion: low
tech: css-js
deps: []
a11y: Cada chip é um botão "Remover filtro Status: Pago"; ao remover, o foco vai para o próximo chip ou para o campo de busca; contagem em role="status"; filtros como checkboxes/selects nativos rotulados.
perf: Debounce de 250ms na busca; filtragem em memória para listas pequenas e no servidor para grandes; history.replaceState sem recarregar.
reference_name: Baymard (Product lists e filtros)
reference_url: https://baymard.com/research/ecommerce-product-lists
react: Guarde filtros em searchParams (nuqs ou useSearchParams do Next) e derive a lista; chips com o Badge do @webcode + botão de remover.
status: stable
---

## Quando usar
- Listas com 2+ filtros: pedidos, catálogo, imóveis, tickets.

## Evite
- Filtros aplicados que só aparecem dentro do painel de filtros.
- Zerar resultados sem dizer qual filtro causou.
- Recarregar a página a cada filtro.

## Implementação
- Chip = rótulo do filtro + valor + ×; "Limpar tudo" só com 2+ chips.
- Resultado vazio diz quais filtros estão ativos e oferece remover o último.
- URL: `?q=...&status=pago,pendente` (no demo, no `#` porque roda como arquivo).
