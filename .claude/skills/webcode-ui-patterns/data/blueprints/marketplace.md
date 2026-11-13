---
id: marketplace
title: Marketplace
family: Commerce
summary: Muitos vendedores, um catálogo. Confiança no vendedor, comparação de ofertas e mediação de problemas pesam tanto quanto o produto.
kpi: Conversão de busca em pedido e taxa de pedidos com problema (disputa, atraso, devolução)
themes: [clean-saas, aurora]
patterns: [glass-sticky-header, command-palette, skeleton-shimmer, bottom-sheet, anchored-popover, toast-stack, empty-state, copy-feedback, view-transition-morph, filter-chips, mega-menu, breadcrumb-overflow, price-pix-installments, product-gallery, mini-cart-drawer, pix-copy-paste, shipping-cep-calculator, bar-ranking, conversion-funnel, product-tour, search-header, drilldown-drawer-menu, auth-sliding-panels, signup-multi-step, password-recovery-flow, footer-ecommerce-br, load-more-infinite, pagination-numbered, order-tracking, chat-thread, notification-center]
density: comfortable
radius: 10
components: [button, input, field, select, combobox, command, card, carousel, sheet, drawer, dialog, popover, tabs, badge, avatar, sonner, skeleton, pagination, accordion, tour]
status: stable
---

## Objetivo
O comprador encontra a melhor oferta e confia em quem vende; o vendedor publica e gerencia sem suporte.

## Duas faces
- **Comprador:** busca protagonista, filtros, oferta com reputação do vendedor, chat, pedido rastreável e mediação.
- **Vendedor (painel):** anúncios, estoque, perguntas, pedidos, repasses e reputação, no estilo do blueprint `admin`.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Busca | sugestões, correção de digitação, filtros (preço, frete grátis, entrega rápida, vendedor) em chips | anchored-popover, bottom-sheet |
| Oferta | produto, vendedor (nota, vendas, tempo de resposta), outras ofertas do mesmo produto, perguntas e respostas | view-transition-morph |
| Carrinho | itens agrupados por vendedor com frete de cada um | toast-stack |
| Pedido | status por vendedor, chat, "Tive um problema" | copy-feedback |
| Painel do vendedor | vendas do dia, perguntas sem resposta, anúncios pausados, repasse previsto | skeleton-shimmer, empty-state |

## Regras
- Reputação do vendedor sempre ao lado do preço, com número de avaliações (não só estrelas).
- "Vendido e entregue por" explícito; selo só quando significa algo verificável.
- Perguntas públicas respondidas pelo vendedor visíveis na oferta, com busca.
- Mediação com prazos claros ("O vendedor tem até 27/10 para responder").
- Frete e prazo por vendedor no carrinho; sem surpresa no checkout.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, para vendedor: cadastrar produto, pedidos e repasse; comprador não recebe tour. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS neutro (o catálogo é colorido); Aurora para marketplaces de nicho/premium.
- **Densidade:** confortável nas listagens, compacta no painel do vendedor.
- **Componentes-chave:** Command de busca, Card de oferta com Avatar do vendedor, Sheet de filtros, Tabs na oferta.

## Estados críticos
- Vendedor novo sem avaliações: diga isso ("Vendedor novo, 3 vendas") em vez de nota vazia.
- Oferta encerrada: mostre ofertas equivalentes.
- Pagamento retido até a entrega: explique quando o vendedor recebe.

## Anti-padrões
- Listagem sem indicar quem vende.
- Chat fora da plataforma incentivado (perde a proteção).
- Filtros que zeram resultados sem avisar.

## Referências
- Baymard, E-commerce search: https://baymard.com/research/ecommerce-search
- NN/g, Trustworthiness in web design: https://www.nngroup.com/articles/trustworthy-design/
