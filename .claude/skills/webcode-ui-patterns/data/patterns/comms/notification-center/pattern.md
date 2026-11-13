---
id: notification-center
title: Central de notificações
category: comms
summary: Sino com contador que abre um painel ancorado com abas Todas/Não lidas, notificações agrupadas por dia, ação direta em cada item (aprovar, ver pedido) e "marcar todas como lidas" com desfazer.
themes: [clean-saas, aurora, playful, editorial]
products: [saas, crm, erp, admin, helpdesk, marketplace, fintech, automation, edtech, health, logistics, b2b]
motion: low
tech: css-js
deps: []
a11y: O sino é um botão com aria-expanded e nome que inclui a contagem ("Notificações, 3 não lidas"). Painel com Popover API (Esc e clique fora fecham, foco volta ao sino). Abas seguem o padrão APG (setas). Não lida tem texto oculto "não lida", não só o ponto azul. Mudanças de contagem vão para um status polite.
perf: Popover nativo, sem biblioteca de posicionamento; a lista renderiza só os 20 mais recentes e carrega mais sob demanda.
reference_name: Material 3 (Badges) e Apple HIG (Notifications)
reference_url: https://developer.apple.com/design/human-interface-guidelines/notifications
react: Popover do @webcode (Radix) ou Popover API; notificações por SSE/WebSocket com React Query. O contador vem do servidor (não conte só o que está carregado).
status: stable
---

## Quando usar
- Produtos com eventos assíncronos que pedem atenção: aprovação, menção, pagamento recebido, chamado atribuído.
- Quando a notificação leva a uma ação (aprovar, responder, ver pedido), não só a um aviso.

## Evite
- Notificar o que a pessoa acabou de fazer ("você salvou"). Isso é toast.
- Contador com número enorme ("1.284"): acima de 99 mostre "99+".
- Misturar avisos do sistema (manutenção) com notificações pessoais sem separar.

## Implementação
- Sino: `button[popovertarget]`; selo com contagem em `--wc-danger-solid` e `aria-hidden`, contagem real no nome do botão.
- Item: ícone por tipo, texto com o sujeito em negrito, tempo relativo (`Intl.RelativeTimeFormat('pt-BR')`), ação primária inline.
- Clicar no item marca como lida e navega; "Marcar todas como lidas" mostra "Desfazer" por 5 s.
- Mobile: o painel vira tela cheia (ou bottom sheet) abaixo de 640px.
