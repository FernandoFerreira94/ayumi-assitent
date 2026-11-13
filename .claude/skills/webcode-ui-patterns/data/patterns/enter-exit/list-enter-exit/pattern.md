---
id: list-enter-exit
title: Lista com entrada e saída nativas
category: enter-exit
summary: Itens entram com @starting-style e saem encolhendo a altura sem pular o layout. CSS moderno, quase sem JavaScript.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [saas, erp, crm, admin, ecommerce, helpdesk, mobile-app, delivery, edtech]
motion: low
tech: css-js
deps: []
a11y: Região aria-live anuncia "Tarefa adicionada" e "Tarefa removida". Foco vai para o item seguinte depois de remover.
perf: Entrada só com transform/opacity. Saída usa grid-template-rows 1fr→0fr, que é layout, mas só no item que sai e por 220ms.
reference_name: MDN (@starting-style)
reference_url: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style
react: Em React prefira AnimatePresence do Motion para saída; a entrada pode continuar em CSS.
status: stable
---

## Quando usar
- Listas editáveis: tarefas, itens do carrinho, filtros aplicados, notificações.

## Evite
- Animar listas de centenas de itens ou resultados de busca a cada tecla.

## Implementação
- Entrada: `@starting-style { opacity: 0; transform: translateY(-6px) scale(.98) }` no `li`.
- Saída: classe `.is-leaving` muda `grid-template-rows` para `0fr` e opacidade para 0; o `li` sai do DOM no `transitionend`.
- A saída é mais rápida que a entrada (150ms vs 220ms).
