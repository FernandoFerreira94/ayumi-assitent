---
id: delivery
title: Delivery e cardápio digital
family: Serviços e verticais
summary: Cardápio de restaurante, app de pedidos ou dark kitchen. Fome tem pressa: foto, preço e "adicionar" em um toque, acompanhamento ao vivo depois.
kpi: Conversão de visita em pedido e tempo médio até finalizar o pedido
themes: [aurora, playful, omnimesa]
patterns: [glass-sticky-header, ios-tab-bar, bottom-sheet, press-spring-button, toast-stack, skeleton-shimmer, copy-feedback, empty-state, list-enter-exit, cep-address-autofill, connection-status, progress-stepper, price-pix-installments, mini-cart-drawer, pix-copy-paste, pull-to-refresh, large-title-collapse, segmented-control, calendar-heatmap, bar-ranking, search-header, drilldown-drawer-menu, auth-animated-tabs, footer-ecommerce-br, footer-app-download, mobile-search-screen, mobile-checkout-steps, ios-stack-navigation, long-press-context-menu, permission-priming, hero-carousel-autoplay, order-tracking, chat-thread]
density: comfortable
radius: 14
components: [button, card, drawer, sheet, dialog, radio-group, checkbox, tabs, badge, sonner, skeleton, field, input, textarea, scroll-area, progress]
status: stable
---

## Objetivo
Do cardápio ao pedido pago em menos de 2 minutos no celular, e depois saber exatamente quando a comida chega.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Loja | aberto/fechado, tempo e taxa de entrega, pedido mínimo, categorias em abas fixas que rolam junto | glass-sticky-header |
| Cardápio | itens com foto, descrição curta, preço; mais vendidos no topo | skeleton-shimmer |
| Item | bottom sheet com foto, adicionais obrigatórios e opcionais (com limite), observação, quantidade, "Adicionar · R$ 42,90" | bottom-sheet, press-spring-button |
| Sacola | itens editáveis, cupom, taxa, troco para dinheiro, total | list-enter-exit, toast-stack |
| Pagamento | Pix (copia e cola + QR), cartão salvo, dinheiro; endereço por CEP com número e complemento | copy-feedback |
| Acompanhar | linha do tempo (recebido, em preparo, saiu, entregue), previsão, contato | — |

## Regras
- Botão de adicionar sempre mostra o total do item com adicionais.
- Adicionais obrigatórios marcados e validados antes do botão final ("Escolha 1 molho").
- Barra da sacola fixa no rodapé com quantidade e total depois do primeiro item.
- Abas de categoria sincronizadas com a rolagem (scroll spy) e tocáveis.
- Loja fechada: mostra quando abre e permite agendar, se houver.
- Taxa e tempo de entrega antes de entrar no cardápio, não no fim.

## Recomendações
- **Tema:** Aurora com acento quente da marca; fotos grandes com `aspect-ratio` fixo.
- **Densidade:** confortável; alvos ≥ 48px.
- **Componentes-chave:** Drawer de item, RadioGroup/Checkbox de adicionais com limite, Sheet da sacola, Progress de status.

## Estados críticos
- Item esgotado: visível mas marcado, nunca some sem explicação.
- Fora da área de entrega: oferece retirada.
- Pix expirando: contador e gerar novo código.

## Anti-padrões
- PDF do cardápio.
- Obrigar cadastro antes de ver preços.
- Carrossel automático de promoções no topo.

## Referências
- Baymard, Mobile e-commerce: https://baymard.com/research/mcommerce-usability
- Apple HIG, Sheets: https://developer.apple.com/design/human-interface-guidelines/sheets
