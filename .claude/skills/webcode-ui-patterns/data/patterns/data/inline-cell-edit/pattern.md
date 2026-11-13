---
id: inline-cell-edit
title: Edição inline de célula com desfazer
category: data
summary: Célula editável que mostra o lápis no hover/foco, entra em edição com clique, Enter ou F2, salva com Enter, cancela com Esc e confirma com um toast "Desfazer". Para campos simples e frequentes (quantidade, status, responsável).
themes: [clean-saas]
products: [erp, saas, crm, admin, b2b, logistics, helpdesk]
motion: low
tech: css-js
deps: []
a11y: O valor é um botão "Editar quantidade de Caneta azul: 120"; em edição vira input rotulado; Enter/Esc/Tab documentados no tooltip; resultado e desfazer em role="status"; o foco volta ao botão ao salvar ou cancelar.
perf: Atualização otimista local com reversão; uma célula em edição por vez; sem re-render da tabela inteira.
reference_name: WAI-ARIA APG (Grid, edição de célula)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
react: Estado editingCell no TanStack Table + Input do @webcode; toast com ação do Sonner para desfazer; mutação otimista com TanStack Query (onMutate/onError).
status: stable
---

## Quando usar
- Ajustes rápidos repetidos: quantidade em pedido, preço em lista, status, responsável.

## Evite
- Edição inline de formulários com validação complexa ou vários campos dependentes: use o `side-sheet-detail`.
- Salvar automaticamente a cada tecla.
- Células editáveis sem nenhum sinal visual.

## Implementação
- Clique, Enter ou F2 entra em edição com o texto selecionado; Enter salva, Esc cancela, Tab salva e vai para a próxima célula editável.
- Validação na hora de salvar com mensagem curta na própria célula.
- Toast "Quantidade alterada · Desfazer" por 6s.
