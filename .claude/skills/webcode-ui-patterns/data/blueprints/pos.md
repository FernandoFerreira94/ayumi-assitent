---
id: pos
title: PDV (ponto de venda)
family: Produto e gestão
summary: Caixa de loja, restaurante ou balcão em tablet ou desktop com toque. Velocidade, alvos grandes e operação offline.
kpi: Tempo médio por venda e vendas perdidas por falha (rede, impressora, TEF)
themes: [clean-saas, omnimesa]
patterns: [toast-stack, press-spring-button, bottom-sheet, empty-state, copy-feedback, top-progress-bar, confirm-alert-dialog, currency-brl-input, cpf-cnpj-field, connection-status, async-button-states, pix-copy-paste, calendar-heatmap, bar-ranking, product-tour, offline-action-queue, segmented-control, filter-chips, undo-delete, kpi-stat-card, command-palette]
density: comfortable
radius: 10
components: [button, input, field, dialog, alert-dialog, sheet, drawer, tabs, sonner, badge, card, toggle-group, scroll-area, input-otp, tour]
status: stable
---

## Objetivo
Fechar a venda em segundos, com uma mão, numa fila, com internet ruim. O operador não pode pensar na interface.

## Layout
- Tablet/desktop paisagem: catálogo (grade de produtos com foto e preço, categorias em abas) à esquerda, carrinho fixo à direita com total grande e botão Cobrar.
- Busca por nome, código e leitor de código de barras sempre ativa (o leitor digita no campo de busca).

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Venda | catálogo + carrinho, quantidade por toque longo ou stepper, desconto, observação | press-spring-button |
| Pagamento | Pix (QR na tela do cliente), cartão (TEF/maquininha), dinheiro com troco calculado, dividir pagamento | copy-feedback |
| Comprovante | imprimir, enviar por WhatsApp/e-mail, NFC-e emitida | toast-stack |
| Caixa | abertura, sangria, suprimento, fechamento com conferência | — |
| Pedidos (restaurante) | comandas/mesas com status e tempo | bottom-sheet |

## Regras
- Alvos de no mínimo 48px (operador com pressa, luva, tela engordurada); botão Cobrar com 64px+.
- Feedback imediato e forte a cada item adicionado (press + contagem no carrinho), sem animação lenta.
- Offline primeiro: venda continua sem rede, fila de sincronização visível no header ("3 vendas para enviar").
- Teclado numérico grande na tela para valores e quantidade; atalhos de teclado físico (F2 busca, F12 cobrar) no desktop.
- Estados de periférico (impressora, TEF, balança) sempre visíveis com ícone e texto.
- Cancelar venda/item pede senha de supervisor quando a regra exigir, com motivo.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, só no primeiro turno do operador, fora do horário de pico; nunca durante uma venda. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS com raio maior (10px) e alvos grandes; modo escuro útil em bares e restaurantes.
- **Densidade:** confortável, nunca compacta (é toque).
- **Componentes-chave:** grade de Card de produto, ToggleGroup de formas de pagamento, Dialog de pagamento, Drawer no celular.

## Estados críticos
- Sem rede: opera e emite NFC-e em contingência, avisando.
- TEF recusou: motivo legível e tentar de novo ou trocar forma, sem perder o carrinho.
- Produto sem preço ou sem estoque: aviso no item, não bloqueio da venda inteira.

## Anti-padrões
- Menus aninhados para chegar a um produto frequente.
- Diálogo de confirmação a cada item.
- Telas que dependem de hover.

## Referências
- Apple HIG, Designing for iPadOS: https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados
- Square, Point of Sale (referência de mercado): https://squareup.com/us/en/point-of-sale
