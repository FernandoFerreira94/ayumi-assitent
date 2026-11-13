---
id: booking
title: Reservas (hospedagem, serviços, experiências)
family: Serviços e verticais
summary: Pousada, salão, quadra, passeio ou coworking. Disponibilidade em tempo real, preço total claro e confirmação imediata.
kpi: Conversão de busca em reserva paga e cancelamentos
themes: [aurora, editorial]
patterns: [glass-sticky-header, bottom-sheet, anchored-popover, press-spring-button, toast-stack, copy-feedback, skeleton-shimmer, confirm-alert-dialog, progress-stepper, async-button-states, price-pix-installments, product-gallery, pix-copy-paste, segmented-control, transparent-hero-header, auth-animated-tabs, footer-app-download, lightbox-zoom, time-slot-picker, faq-accordion]
density: comfortable
radius: 12
components: [button, calendar, popover, drawer, sheet, dialog, alert-dialog, toggle-group, card, carousel, field, input, select, badge, sonner, skeleton]
status: stable
---

## Objetivo
Escolher data, ver o preço final e garantir a vaga sem trocar mensagens.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Busca | datas (intervalo), pessoas (stepper), local/serviço | anchored-popover, bottom-sheet |
| Resultados/opções | disponibilidade, preço total para as datas, política de cancelamento resumida | skeleton-shimmer |
| Detalhe | fotos, o que inclui, regras, avaliações, calendário com disponibilidade e preço por dia | — |
| Reserva | dados mínimos, pagamento (Pix com desconto, cartão parcelado), política de cancelamento por extenso | press-spring-button |
| Confirmação | código, adicionar ao calendário, como chegar, contato | copy-feedback, toast-stack |
| Minhas reservas | alterar, cancelar com reembolso calculado | confirm-alert-dialog |

## Regras
- Preço total com taxas para as datas escolhidas, sempre; preço por noite/hora como apoio.
- Calendário de intervalo com dias indisponíveis riscados e preço por dia quando variar.
- Horários (serviços) em chips agrupados por período (manhã, tarde, noite).
- Segurar a vaga por tempo limitado durante o pagamento, com contador visível.
- Política de cancelamento antes do pagamento, com o reembolso em R$ calculado.

## Recomendações
- **Tema:** Aurora (experiências, turismo) ou Editorial (hotelaria boutique).
- **Densidade:** confortável.
- **Componentes-chave:** Calendar de intervalo em Popover/Drawer, stepper de pessoas, AlertDialog de cancelamento com valor.

## Estados críticos
- Vaga tomada durante o checkout: avisa e sugere datas próximas.
- Pagamento pendente (Pix): reserva provisória com prazo.
- Sem disponibilidade no mês: navegar para o próximo mês com vaga.

## Anti-padrões
- Taxas reveladas só no último passo.
- Reserva "solicitada" sem prazo de resposta.
- Calendário que não mostra disponibilidade antes de clicar.

## Referências
- Baymard, Travel and accommodation UX: https://baymard.com/research/travel-accommodations
- Material 3, Date pickers: https://m3.material.io/components/date-pickers/overview
