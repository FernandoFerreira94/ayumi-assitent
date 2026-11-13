---
id: side-sheet-detail
title: Sheet lateral de detalhe (lista + registro)
category: overlay
summary: Painel que abre da direita com o detalhe da linha clicada sem esconder a lista. Não modal no desktop (troca de registro com J/K ou clicando outra linha) e modal em tela cheia no mobile.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, helpdesk, logistics, marketplace, ai-app, automation, b2b, health]
motion: medium
tech: css-js
deps: []
a11y: Linhas são botões com aria-expanded e aria-controls; o sheet é um dialog com aria-labelledby; foco vai para o título ao abrir e volta à linha ao fechar; Esc fecha; J/K e setas só agem com o foco dentro da lista ou do sheet.
perf: Só translate e opacity com mola smooth via linear(); trocar de registro atualiza texto, sem reabrir a animação.
reference_name: Material 3 (Side sheets)
reference_url: https://m3.material.io/components/side-sheets/overview
react: Use @webcode/sheet com modal={false} e sem overlay no desktop, item aberto na URL (?id=1043) e useHotkeys/onKeyDown para J/K.
status: stable
---

## Quando usar
- CRM, helpdesk, admin e ERP: abrir pedido, ticket ou contato a partir de uma tabela e continuar navegando.
- Edição rápida de poucos campos sem perder a posição na lista.

## Evite
- Formulários longos ou com várias etapas: vire página.
- Sheet sobre sheet. Sheet não modal em telas menores que 960px (a lista fica espremida).

## Implementação
- `dialog.show()` (não modal) a partir de 960px; `showModal()` em tela cheia abaixo disso.
- A lista ganha `padding-inline-end` igual à largura do sheet para nada ficar escondido atrás dele.
- J/K ou ↑/↓ trocam o registro e mantêm o sheet aberto; o registro ativo fica marcado na lista (`aria-current`).
- Entrada com `--wc-motion-spring-smooth`; saída ease-in curta. Reduced motion: só fade.
