---
id: habits
product: habits
title: App de hábitos e bem-estar
family: Apps e ferramentas
summary: Registrar hábitos, água, treino, leitura ou humor em um toque por dia. O produto é a constância: lembrete na hora certa, progresso visível e recaída sem culpa.
kpi: Retenção D30 e dias com pelo menos um registro por semana
themes: [playful, aurora]
patterns: [onboarding-pages, permission-priming, ios-tab-bar, ios-stack-navigation, card-modal-sheet, long-press-context-menu, extended-fab-scroll, offline-action-queue, calendar-heatmap, bullet-goal, ios-switch, press-spring-button, segmented-control, toast-stack, undo-delete, empty-state, skeleton-shimmer, copy-feedback]
density: comfortable
radius: 16
components: [button, card, badge, drawer, sheet, dialog, tabs, switch, checkbox, field, input, sonner, skeleton, empty, stat-card]
status: beta
---

## Objetivo
Abrir, marcar e fechar em menos de 5 segundos, e voltar amanhã. O app celebra o progresso sem punir o dia perdido.

## Navegação
- Tab bar: **Hoje**, **Progresso**, **Ajustes**. Hoje é a tela inicial e mostra só o que vale para o dia.
- Criar e editar hábito em modal em cartão (nome, ícone, dias, horário do lembrete, meta).
- Toque longo num hábito: pular hoje, editar, arquivar; o mesmo menu pelo ⋯.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Boas-vindas | até 3 páginas sobre o benefício; termina criando o primeiro hábito | onboarding-pages |
| Hoje | lista de hábitos do dia, marcar com um toque (com mola e haptic), contador para metas numéricas (copos de água) | press-spring-button, long-press-context-menu, extended-fab-scroll |
| Novo hábito | sugestões prontas, dias da semana, horário, meta | card-modal-sheet, segmented-control |
| Progresso | calendário de calor por hábito, sequência atual e melhor, meta da semana | calendar-heatmap, bullet-goal |
| Lembretes | pedido de notificação depois de criar o 1º hábito, com o horário escolhido | permission-priming, ios-switch |

## Regras
- Marcar é otimista e funciona offline; sincroniza depois.
- Desmarcar sem confirmação (desfazer no toast). Excluir hábito pede confirmação e oferece arquivar.
- Sequência "pausa" em vez de zerar quando o dia foi pulado de propósito; linguagem sem culpa ("Amanhã é um novo dia").
- Celebração proporcional: mola `bouncy` e confete só em marcos (7, 30, 100 dias), nunca a cada toque.
- Lembrete no horário do hábito, com ação direta na notificação ("Marcar como feito").
- Dados de saúde e humor são sensíveis (LGPD): consentimento explícito e exportação/remoção nos Ajustes.

## Recomendações
- **Tema:** Playful (acolhedor, colorido com contraste); Aurora para bem-estar premium.
- **Densidade:** confortável; linhas de 64px, alvo de marcar ≥ 48px.
- **Componentes-chave:** Drawer, Switch, StatCard, Card, Sonner.
- **Plataforma:** PWA serve para MVP; Expo quando widget na tela inicial, HealthKit/Health Connect ou lembretes confiáveis no iOS forem essenciais.

## Estados críticos
- Primeiro dia (vazio): sugestões de hábitos prontos, não uma tela em branco.
- Notificação negada: lembrete aparece dentro do app e Ajustes explica como ativar.
- Volta depois de 1 semana sem abrir: boas-vindas de volta, sem mostrar sequência quebrada em vermelho.

## Anti-padrões
- Gamificação que pune (perder vidas, sequência zerada em destaque).
- Pedir notificação na primeira abertura.
- Onboarding de 6 telas com cadastro obrigatório antes de criar o primeiro hábito.

## Referências
- Apple HIG, Onboarding e Notifications: https://developer.apple.com/design/human-interface-guidelines/onboarding · https://developer.apple.com/design/human-interface-guidelines/notifications
- Material 3, Extended FAB: https://m3.material.io/components/extended-fab/guidelines
- NN/g, Mobile app onboarding: https://www.nngroup.com/articles/mobile-app-onboarding/
