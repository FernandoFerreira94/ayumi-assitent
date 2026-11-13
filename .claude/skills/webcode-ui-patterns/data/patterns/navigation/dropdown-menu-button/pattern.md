---
id: dropdown-menu-button
title: Menu suspenso de ações (menu button com teclado completo)
category: navigation
summary: Botão que abre um menu de ações com grupos, atalhos, itens de marcar e de escolha única, item desabilitado e ação destrutiva. Abre a partir do botão com escala curta e funciona inteiro pelo teclado.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, helpdesk, devtools, ai-app, automation]
motion: low
tech: css-js
deps: []
a11y: Padrão Menu Button da APG: aria-haspopup="menu", aria-expanded, role=menu com menuitem/menuitemcheckbox/menuitemradio e aria-checked. Setas, Home/End, digitação para pular ao item, Enter/Espaço ativam, Esc e Tab fecham devolvendo o foco. Desabilitado usa aria-disabled e continua navegável.
perf: Menu montado uma vez, aberto com popover nativo (top layer, sem z-index). Posição calculada só na abertura; vira para cima se faltar espaço.
reference_name: WAI-ARIA APG (Menu Button) e menus do macOS
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
react: DropdownMenu do shadcn (Radix) já implementa o padrão; aplique os tokens, a origem da animação (transform-origin do Radix) e os atalhos com DropdownMenuShortcut.
status: stable
---

## Quando usar
- Menu da conta, "mais ações" (⋯) em linhas e cards, ordenação e visualização de listas.

## Evite
- Usar role=menu para navegação de site (links): aí é disclosure (`mega-menu`, `apple-expand-menu`).
- Ação destrutiva sem confirmação: abra o `confirm-alert-dialog`.

## Implementação
- `popover="manual"` no menu; abra com `showPopover()` e posicione pelo `getBoundingClientRect()` do botão.
- `transform-origin` no canto do botão; `@starting-style` com `scale(.96)` e opacidade.
- Foco itinerante: só o item ativo tem `tabindex="0"`; os outros `-1`.
- Typeahead: acumule letras por 500ms e pule para o primeiro item que começa com elas.
