---
id: bulk-selection-bar
title: Seleção em lote com barra de ações
category: data
summary: Checkbox por linha com marcar todos (indeterminado quando parcial), Shift+clique para intervalo e uma barra que sobe com as ações e a contagem; inclui "selecionar todos os 1.240" além da página.
themes: [clean-saas, aurora]
products: [erp, saas, crm, admin, helpdesk, logistics, ecommerce, b2b]
motion: low
tech: css-js
deps: []
a11y: Checkboxes nativos com rótulo por linha ("Selecionar pedido 1043"); o mestre usa indeterminate; a barra é uma region rotulada que anuncia a contagem em role="status"; Esc limpa a seleção; ações destrutivas pedem confirmação.
perf: Estado em um Set de ids; a barra entra com translate e opacity; nenhuma reflow da tabela ao aparecer (posição fixa).
reference_name: IBM Carbon (Data table, batch actions)
reference_url: https://carbondesignsystem.com/components/data-table/usage/
react: TanStack Table com enableRowSelection + rowSelection; Checkbox do @webcode já tem indeterminate. Barra como componente fixo animado com Motion ou CSS.
status: stable
---

## Quando usar
- Arquivar, exportar, atribuir, mudar status ou excluir vários registros de uma vez.

## Evite
- Ações em lote escondidas num menu sem indicar quantos itens estão selecionados.
- Perder a seleção ao paginar sem avisar.
- Excluir em lote sem confirmação com a quantidade.

## Implementação
- Shift+clique marca o intervalo desde o último clicado.
- A barra fica fixa no rodapé (mobile e desktop) e não cobre a última linha (padding no container).
- "Selecionar todos os N" aparece quando a página inteira está marcada.
- Excluir abre o `confirm-alert-dialog` com a contagem.
