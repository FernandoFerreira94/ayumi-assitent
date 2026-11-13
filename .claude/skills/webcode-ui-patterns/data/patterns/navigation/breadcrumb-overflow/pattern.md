---
id: breadcrumb-overflow
title: Breadcrumb com recolhimento no meio
category: navigation
summary: Trilha de navegação que mostra o primeiro e os dois últimos níveis e recolhe o meio num botão "…" com menu quando falta espaço; o último item é a página atual e não é link.
themes: [clean-saas, editorial, aurora]
products: [saas, erp, crm, admin, devtools, ecommerce, b2b, helpdesk, marketplace]
motion: none
tech: css-js
deps: []
a11y: nav aria-label="Trilha" com lista ordenada; separadores aria-hidden; último item com aria-current="page"; botão "…" com aria-expanded abre lista de links acessível por teclado (Esc fecha e devolve o foco).
perf: Decide o recolhimento com ResizeObserver no container, sem medir a cada frame.
reference_name: NN/g (Breadcrumbs: 11 Design Guidelines)
reference_url: https://www.nngroup.com/articles/breadcrumbs/
react: Use o Breadcrumb do shadcn (BreadcrumbEllipsis + DropdownMenu) com a mesma regra de recolher.
status: stable
---

## Quando usar
- Hierarquias com 3+ níveis (Clientes / Acme / Contratos / 2026).

## Evite
- Breadcrumb em sites rasos (2 níveis).
- Usar breadcrumb como histórico de navegação.
- Truncar todos os itens com reticências.

## Implementação
- Sempre visíveis: primeiro item, penúltimo e atual. O resto vai para o menu "…" quando não cabe.
- Item atual com `max-width` e reticências + `title` para nomes longos.
- No mobile, mostre só "← Penúltimo" como link de voltar.
