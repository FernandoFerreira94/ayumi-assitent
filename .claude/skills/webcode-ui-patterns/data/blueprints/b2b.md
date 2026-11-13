---
id: b2b
title: Catálogo e pedidos B2B
family: Commerce
summary: Portal para lojistas e revendedores comprarem do fornecedor. Preço por cliente, pedido grande e recompra rápida, mais planilha que vitrine.
kpi: Pedidos feitos sem representante e tempo para montar um pedido recorrente
themes: [clean-saas]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, anchored-popover, side-sheet-detail, copy-feedback, top-progress-bar, cpf-cnpj-field, currency-brl-input, sortable-data-table, inline-cell-edit, filter-chips, mega-menu, collapsible-sidebar, progress-stepper, async-button-states, price-pix-installments, mini-cart-drawer, shipping-cep-calculator, search-header, apple-expand-menu, drilldown-drawer-menu, two-factor-challenge, footer-saas-columns, footer-ecommerce-br, pagination-numbered, plan-comparison-table, notification-center]
density: compact
radius: 6
components: [button, input, field, select, combobox, data-table, table, command, sheet, dialog, popover, tooltip, sonner, skeleton, badge, tabs, pagination]
status: stable
---

## Objetivo
O comprador profissional monta um pedido de 80 itens em minutos, com o preço e as condições dele, e repete o último pedido em um clique.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Catálogo | tabela com SKU, foto pequena, embalagem, preço do cliente, estoque, quantidade editável na linha | anchored-popover, skeleton-shimmer |
| Pedido rápido | colar lista de SKUs e quantidades ou importar planilha | copy-feedback |
| Carrinho | totais, pedido mínimo, condições de pagamento (boleto 28/56, prazo), frete CIF/FOB | toast-stack |
| Pedidos | histórico com status, NF-e e boleto para baixar, repetir pedido | side-sheet-detail |
| Financeiro | títulos em aberto, limite de crédito disponível | empty-state |

## Regras
- Preço sempre do cliente logado (tabela, desconto por volume); preço público nunca aparece para logado.
- Quantidade em múltiplos da embalagem ("cx c/ 12") com arredondamento explícito.
- Teclado: Tab entre campos de quantidade, Enter adiciona, busca por SKU no ⌘K.
- Pedido mínimo e frete grátis com barra de progresso ("faltam R$ 320 para frete grátis").
- Vários usuários por empresa com papéis (comprador, aprovador, financeiro); pedido acima do limite vai para aprovação.

## Recomendações
- **Tema:** Clean SaaS com a marca do fornecedor no acento.
- **Densidade:** compacta.
- **Componentes-chave:** DataTable com edição de quantidade, Command, Sheet de pedido, Popover de filtros.

## Estados críticos
- Item sem estoque: previsão de chegada e opção de manter no pedido como pendente.
- Crédito insuficiente: mostra o valor disponível e alternativas (Pix, parcial).
- Pedido em aprovação: quem aprova e desde quando.

## Anti-padrões
- Vitrine de varejo com uma foto grande por produto.
- Esconder o preço até o carrinho.
- Exigir representante para repetir pedido.

## Referências
- Baymard, Product lists e filtros: https://baymard.com/research/ecommerce-product-lists
- Shopify, B2B: https://help.shopify.com/en/manual/b2b
