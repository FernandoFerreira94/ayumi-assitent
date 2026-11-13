---
id: logistics
title: Logística e rastreamento
family: Produto e gestão
summary: Gestão de entregas, frota e rastreio (transportadora, last mile, operação própria). Mapa, status em tempo real e exceções primeiro.
kpi: Entregas no prazo (OTD) e tempo para tratar uma exceção
themes: [clean-saas]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, bottom-sheet, copy-feedback, top-progress-bar, ios-tab-bar, side-sheet-detail, anchored-popover, sortable-data-table, filter-chips, kpi-stat-card, collapsible-sidebar, connection-status, status-banner, pull-to-refresh, swipe-row-actions, line-chart-crosshair, bar-ranking, calendar-heatmap, product-tour, app-top-bar, order-tracking, notification-center]
density: compact
radius: 6
components: [button, input, field, select, combobox, data-table, tabs, sheet, drawer, dialog, dropdown-menu, tooltip, sonner, skeleton, badge, sidebar, calendar, progress, tour]
status: stable
---

## Objetivo
O operador vê primeiro o que está dando errado; o cliente final sabe exatamente onde está o pedido; o motorista só precisa do próximo endereço.

## Três faces
- **Torre de controle (desktop):** mapa + lista sincronizados, exceções no topo (atraso, ocorrência, sem sinal).
- **App do motorista (mobile):** rota do dia, próxima parada em destaque, prova de entrega (foto, assinatura, código), modo offline. Tab bar: Rota, Entregas, Ocorrências, Perfil.
- **Rastreio público:** linha do tempo com status, previsão e contato; link curto enviado por WhatsApp/SMS.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Painel | entregas por status, exceções, mapa com veículos | skeleton-shimmer |
| Entrega | linha do tempo, destinatário, volumes, ocorrências, comprovante | copy-feedback |
| Roteirização | paradas arrastáveis com alternativa por botões, distância e tempo total | toast-stack |
| Motorista: parada | endereço com abrir no Maps/Waze, ligar, registrar entrega ou ocorrência | bottom-sheet, ios-tab-bar |
| Rastreio público | status grande, previsão, etapas, ajuda | — |

## Regras
- Status em linguagem do cliente ("Saiu para entrega", não "EM_ROTA").
- Previsão como janela ("hoje, 14h–16h"), atualizada sozinha.
- Mapa nunca é o único jeito de ver dados: lista equivalente ao lado (acessibilidade e desempenho).
- App do motorista com alvos grandes, alto contraste, uso com uma mão e funcionamento offline com fila.
- Ocorrências com motivos pré-definidos e foto obrigatória quando a regra exigir.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, mapa/lista de entregas, status e ocorrências; em operação de campo prefira o estilo flutuante. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS; app do motorista com modo escuro automático à noite.
- **Densidade:** compacta na torre, confortável no app.
- **Componentes-chave:** DataTable, Sheet de detalhe, Drawer no app, Progress de rota, Badge de status com ícone.

## Estados críticos
- Veículo sem sinal há X min.
- Endereço não encontrado: motorista registra e a central recebe alerta.
- Entrega reagendada: cliente escolhe nova janela pelo link.

## Anti-padrões
- Mapa como tela inicial pesada no celular do motorista.
- Códigos internos de status para o cliente final.
- Rastreio que exige login.

## Referências
- Material 3, Lists e Cards para apps operacionais: https://m3.material.io/components/lists/overview
- Apple HIG, Maps: https://developer.apple.com/design/human-interface-guidelines/maps
