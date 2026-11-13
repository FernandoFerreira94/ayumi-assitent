---
id: automation
title: Automação e workflows
family: Apps e ferramentas
summary: Construtor de fluxos (gatilho → ações), integrações e execuções. O usuário precisa confiar que roda sozinho e entender quando falha.
kpi: Fluxos ativos por conta e taxa de execuções com erro não tratado
themes: [clean-saas, aurora]
patterns: [command-palette, side-sheet-detail, anchored-popover, toast-stack, empty-state, skeleton-shimmer, ios-switch, copy-feedback, confirm-alert-dialog, collapsible-sidebar, status-banner, connection-status, async-button-states, ai-prompt-composer, ai-agent-steps, ai-action-approval, product-tour, announcement-cta-header, app-top-bar, dropdown-menu-button, login-split-screen, signup-multi-step, footer-saas-columns, pricing-tiers, plan-comparison-table, notification-center, kanban-board]
density: comfortable
radius: 8
components: [button, input, field, select, combobox, sheet, dialog, alert-dialog, popover, command, tabs, table, badge, switch, tooltip, sonner, skeleton, scroll-area, tour]
status: stable
---

## Objetivo
Montar um fluxo sem programar, testar com dados reais antes de ligar e ser avisado com clareza quando algo quebrar.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Fluxos | lista com status (ligado/desligado), última execução, erros nas últimas 24h | ios-switch, empty-state |
| Editor | etapas em lista vertical ou canvas; adicionar etapa com busca de apps/ações; configuração em sheet lateral | side-sheet-detail, command-palette |
| Mapear campos | campos da etapa anterior em popover pesquisável, com exemplo do valor real | anchored-popover |
| Testar | executar com um item real, ver entrada e saída de cada etapa | copy-feedback |
| Execuções | histórico com status, duração, reexecutar, dados de cada etapa | skeleton-shimmer, toast-stack |
| Conexões | contas conectadas, expiradas, reconectar | confirm-alert-dialog |

## Regras
- Fluxo em lista vertical é o padrão (acessível, funciona no mobile); canvas livre só para fluxos com muitos ramos, sempre com alternativa por teclado.
- Toda etapa mostra dados de exemplo reais depois do teste; mapear campos sem ver valores é adivinhar.
- Ligar o fluxo só depois de um teste bem-sucedido (ou aviso explícito).
- Erro diz qual etapa, qual dado e o que fazer; reexecutar a partir da etapa que falhou.
- Notificação de falha por e-mail/WhatsApp configurável, agrupada (não uma por erro).
- Versões do fluxo com desfazer alterações.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, criar o primeiro fluxo, gatilho e onde ver execuções/erros. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS; Aurora para ferramentas consumer/criadores.
- **Densidade:** confortável no editor, compacta em execuções.
- **Componentes-chave:** Sheet de configuração, Combobox/Command de apps, Popover de campos, Table de execuções, Switch de ativar.

## Estados críticos
- Conexão expirada: fluxos afetados listados e reconectar em um passo.
- Limite de execuções do plano: aviso em 80% e o que acontece ao bater.
- Loop ou volume anormal: pausa automática com explicação.

## Anti-padrões
- Canvas de nós como única interface.
- Erro genérico "Falha na execução".
- Ligar fluxo sem teste e sem aviso.

## Referências
- WAI-ARIA APG, Disclosure e Combobox: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ · https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- NN/g, Error message guidelines: https://www.nngroup.com/articles/error-message-guidelines/
