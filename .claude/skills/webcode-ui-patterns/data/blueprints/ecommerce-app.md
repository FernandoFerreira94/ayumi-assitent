---
id: ecommerce-app
product: ecommerce
title: App de loja (e-commerce mobile)
family: Commerce
summary: Loja no celular, como PWA ou app. Busca em primeiro lugar, produto que vende com foto e prova social, sacola sempre a um toque e checkout curto com Pix.
kpi: Conversão mobile (sessão → pedido) e taxa de recompra em 90 dias
themes: [aurora, playful, clean-saas]
patterns: [ios-tab-bar, mobile-search-screen, ios-stack-navigation, view-transition-morph, product-gallery, price-pix-installments, shipping-cep-calculator, bottom-sheet, mini-cart-drawer, mobile-checkout-steps, mobile-keyboard-form, pix-copy-paste, long-press-context-menu, skeleton-shimmer, filter-chips, toast-stack, empty-state, permission-priming, undo-delete, lightbox-zoom, order-tracking]
density: comfortable
radius: 14
components: [button, card, badge, drawer, sheet, dialog, tabs, radio-group, checkbox, field, input, input-cep, price-tag, carousel, image-viewer, sonner, skeleton, empty, load-more]
status: beta
---

## Objetivo
Achar o produto em poucos toques, ter confiança para comprar (foto, medida, prazo, troca) e pagar em menos de um minuto.

## Navegação
- Tab bar: **Início**, **Buscar**, **Sacola** (com contador), **Pedidos**, **Conta**.
- Pilha: vitrine/busca → produto → avaliações/medidas. Transição com continuidade da foto (lista → produto).
- Filtros e ordenação em bottom sheet com contagem de resultados no botão ("Ver 128 produtos").

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Início | busca visível, categorias em chips, vitrines personalizadas, banners com moderação | filter-chips, skeleton-shimmer |
| Busca | recentes, sugestões, resultados com filtro em sheet, grade 2 colunas | mobile-search-screen, filter-chips, bottom-sheet |
| Produto | galeria com zoom e swipe, preço Pix e parcelas, variação, CEP para prazo, avaliações, botão Adicionar fixo no rodapé | product-gallery, price-pix-installments, shipping-cep-calculator |
| Sacola | itens com quantidade, remover com desfazer, frete, cupom, total sempre visível | mini-cart-drawer, undo-delete |
| Checkout | entrega, pagamento (Pix em destaque), revisão | mobile-checkout-steps, mobile-keyboard-form, pix-copy-paste |
| Pedidos | status em linha do tempo, rastreio, trocar/devolver, comprar de novo | long-press-context-menu |

## Regras
- Busca tolerante a acento e erro de digitação, com sugestões desde a 2ª letra.
- Botão "Adicionar à sacola" fixo no rodapé do produto, com preço; ao adicionar, feedback sem tirar da página (toast com "Ver sacola").
- Prazo e frete calculados pelo CEP já no produto; nunca surpresa no checkout.
- Compra como convidado; conta criada depois do pedido com um toque.
- Pix com desconto explícito, QR e copia e cola, e confirmação automática.
- Notificações pedidas depois do primeiro pedido ("avisar quando sair para entrega"), nunca na abertura.

## Recomendações
- **Tema:** Aurora (consumo, tecnologia), Playful (público jovem, presentes), Clean SaaS (B2B e reposição).
- **Densidade:** confortável; grade de 2 colunas com foto 4:5.
- **Componentes-chave:** PriceTag, Carousel + ImageViewer, InputCEP, Drawer, Load More.

## Estados críticos
- Produto sem estoque na variação: avise antes de escolher e ofereça "Avise-me".
- Pagamento Pix expirado: gerar de novo sem refazer o pedido.
- Sem conexão: vitrine em cache e sacola local; checkout pede conexão com mensagem clara.

## Anti-padrões
- Pop-up de cupom ou de app na primeira tela.
- Esconder busca atrás de ícone.
- Cadastro obrigatório antes do pagamento.
- Rolagem infinita sem forma de chegar ao rodapé (troca, contato, CNPJ).

## Referências
- Baymard Institute, Mobile e-commerce e Checkout usability: https://baymard.com/research/mcommerce-usability · https://baymard.com/research/checkout-usability
- Apple HIG, Search fields: https://developer.apple.com/design/human-interface-guidelines/search-fields
- Banco Central, Pix: https://www.bcb.gov.br/estabilidadefinanceira/pix
