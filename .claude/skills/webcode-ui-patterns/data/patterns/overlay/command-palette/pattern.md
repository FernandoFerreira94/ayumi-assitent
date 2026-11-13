---
id: command-palette
title: Paleta de comandos (⌘K)
category: overlay
summary: Busca global de ações e páginas com ⌘K, filtro instantâneo, navegação por setas e grupos. Essencial em SaaS, ERP e dev tools.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, devtools, helpdesk, ai-app, automation, b2b, logistics, marketplace, pos]
motion: low
tech: css-js
deps: []
a11y: Padrão combobox com aria-activedescendant; Esc fecha e devolve o foco. Atalho também tem botão visível. Abertura quase instantânea (sem atrasar uso repetido).
perf: Filtro em memória; para mais de 500 itens, debounce de 80ms e virtualização.
reference_name: Linear e Raycast
reference_url: https://www.raycast.com
react: Use o Command do shadcn (cmdk) com este visual; a lógica de teclado já vem pronta.
status: stable
---

## Quando usar
- Produtos com muitas telas ou ações. Usuários avançados vivem nela.

## Evite
- Como único caminho para uma função: tudo que está na paleta também precisa estar na UI.
- Animação longa: é aberta dezenas de vezes por dia. Entrada de 150ms, saída instantânea.

## Implementação
- `dialog` nativo + input + `ul role="listbox"`. O item ativo é marcado com `aria-selected` e o input aponta para ele com `aria-activedescendant`.
- Atalhos exibidos com `kbd`. ⌘ no Mac, Ctrl no resto (detectado por `navigator.platform`).
