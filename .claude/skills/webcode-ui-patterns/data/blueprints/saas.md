---
id: saas
title: SaaS e dashboard
family: Produto e gestão
summary: Aplicação usada todo dia. Densidade, velocidade e atalhos valem mais que efeito visual.
kpi: Ativação (usuário que completa a ação-chave na primeira semana) e retenção semanal
themes: [clean-saas, aurora]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, ios-switch, press-spring-button, copy-feedback, top-progress-bar, list-enter-exit, bottom-sheet, side-sheet-detail, confirm-alert-dialog, anchored-popover, form-error-summary, otp-code-input, sortable-data-table, bulk-selection-bar, filter-chips, kpi-stat-card, collapsible-sidebar, url-tabs, breadcrumb-overflow, status-banner, undo-delete, async-button-states, progress-stepper, ai-prompt-composer, ai-streaming-response, line-chart-crosshair, bar-ranking, bullet-goal, conversion-funnel, product-tour, announcement-cta-header, app-top-bar, dropdown-menu-button, login-split-screen, signup-multi-step, password-recovery-flow, two-factor-challenge, footer-saas-columns, pricing-tiers, plan-comparison-table, faq-accordion, logo-cloud-marquee, notification-center, kanban-board]
density: comfortable
radius: 8
components: [button, input, field, select, data-table, tabs, dialog, alert-dialog, sheet, command, dropdown-menu, popover, tooltip, sonner, skeleton, badge, card, switch, sidebar, chart, avatar, tour]
status: stable
---

## Objetivo
Fazer o usuário chegar ao "aha" rápido e depois sair do caminho dele. O produto é a ferramenta, não o espetáculo.

## Estrutura de navegação
- **Sidebar** recolhível com 5–8 áreas, workspace switcher no topo e conta no rodapé.
- **Header da página** com título, filtros e ação primária à direita.
- **⌘K** para tudo (command-palette). Atalhos exibidos nos menus.
- No mobile: sidebar vira sheet; ações principais em bottom bar se o uso mobile for relevante.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Onboarding | 3–5 passos, dados de exemplo, checklist de ativação, tour de primeiro acesso | product-tour, press-spring-button |
| Dashboard | 3–5 KPIs com variação, 1 gráfico principal, lista "precisa de atenção" | skeleton-shimmer |
| Lista / tabela | busca, filtros salvos, ordenação, seleção em lote, paginação ou virtualização | empty-state, list-enter-exit |
| Detalhe | cabeçalho com status, abas, atividade/histórico | toast-stack |
| Configurações | seções com switches de efeito imediato, zona de perigo separada | ios-switch, copy-feedback |

## Regras
- Densidade: linhas de tabela de 40–44px, fonte 14–15px, números tabulares.
- Cor de destaque só para ação primária e estado selecionado. Status usa cores semânticas com texto, não só cor.
- Animações abaixo de 200ms. Nada anima em ações repetidas por teclado.
- Toda ação destrutiva tem desfazer (toast com ação) em vez de modal de confirmação, quando possível.
- Salvar automático com indicador discreto; quando não for possível, botão Salvar fixo e aviso de alterações não salvas.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, até 5 passos até a ação-chave de ativação; depois o checklist assume. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Estados críticos
- Primeiro uso (vazio que ensina), carregando (skeleton), sem permissão, erro de integração, limite do plano atingido.

## Anti-padrões
- Dashboard com 12 gráficos que ninguém lê.
- Modal sobre modal.
- Hero e gradientes de marketing dentro do app.
