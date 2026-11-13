---
id: mobile-app
title: App mobile (iOS e Android)
family: Apps e ferramentas
summary: App nativo ou PWA com cara de iOS. Tab bar, sheets, gestos com alternativa e respeito às convenções de cada plataforma.
kpi: Retenção D1/D7/D30 e sessões por usuário ativo por semana
themes: [aurora, playful]
patterns: [ios-tab-bar, bottom-sheet, ios-switch, press-spring-button, list-enter-exit, skeleton-shimmer, toast-stack, splash-logo-reveal, view-transition-morph, confirm-alert-dialog, undo-delete, connection-status, swipe-row-actions, pull-to-refresh, large-title-collapse, segmented-control, drilldown-drawer-menu, auth-flip-card, auth-animated-tabs, footer-minimal, footer-app-download, ios-stack-navigation, card-modal-sheet, action-sheet, long-press-context-menu, mobile-keyboard-form, mobile-search-screen, onboarding-pages, permission-priming, extended-fab-scroll, offline-action-queue]
density: comfortable
radius: 14
components: [button, drawer, sheet, dialog, alert-dialog, tabs, card, switch, avatar, badge, input, field, sonner, skeleton, scroll-area]
status: stable
---

## Objetivo
Parecer nativo: rápido, previsível, com os gestos e controles que a pessoa já usa nos outros apps.

## Estrutura
- Tab bar com 3–5 destinos; cada aba mantém sua pilha.
- Título grande que encolhe ao rolar nas telas raiz; botão voltar com o título anterior.
- Ações contextuais em bottom sheet; confirmações destrutivas em alert (centro) ou action sheet.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Onboarding | 3 telas no máximo, permissões pedidas no momento do uso (não no início) | splash-logo-reveal, onboarding-pages, permission-priming |
| Feed / início | conteúdo principal, pull to refresh, skeleton no primeiro carregamento, ação principal em FAB | skeleton-shimmer, list-enter-exit, extended-fab-scroll |
| Detalhe | push na pilha com voltar pela borda, ou continuidade a partir do item | ios-stack-navigation, view-transition-morph |
| Busca | foco, recentes, escopos e cancelar | mobile-search-screen |
| Criar | modal em cartão ou sheet com formulário curto e teclado certo | card-modal-sheet, bottom-sheet, mobile-keyboard-form |
| Ações sobre item | action sheet após toque; toque longo como atalho | action-sheet, long-press-context-menu |
| Ajustes | lista agrupada com switches de efeito imediato, conta, privacidade, sair | ios-switch, confirm-alert-dialog |

## Regras
- Alvos ≥ 44pt; nada importante na área do gesto de voltar nem atrás do indicador de início (safe areas).
- Swipe em lista (arquivar, excluir) sempre com alternativa visível (menu ou botão) — WCAG 2.5.7.
- Haptics leves em confirmações e trocas de estado (onde houver suporte), nunca em rolagem.
- Teclado não cobre o campo ativo; Enter avança/envia com `enterkeyhint`.
- Offline: conteúdo já visto continua disponível; ações entram em fila (`offline-action-queue`).
- Checklist completo em `guidelines/mobile.md` (safe areas, gestos, transições, teclado, performance, equivalências Expo).
- Android: botão voltar do sistema fecha sheets e volta a pilha; respeite tipografia e feedback da plataforma quando for nativo.

## Recomendações
- **Tema:** Aurora (vidro em barras e sheets, molas). Para Expo/React Native, use `build/json/aurora.json`.
- **Densidade:** confortável; listas de 52–64px.
- **Componentes-chave:** Drawer/Sheet, Tabs (segmentado), Switch, AlertDialog.

## Estados críticos
- Permissão negada: explica o que perde e leva aos ajustes do sistema.
- Atualização obrigatória: tela clara com o motivo.
- Sem conexão: faixa discreta, não modal.

## Anti-padrões
- Hambúrguer escondendo a navegação principal.
- Pedir todas as permissões no primeiro uso.
- Modal sobre modal.

## Referências
- Apple HIG, Tab bars, Sheets e Modality: https://developer.apple.com/design/human-interface-guidelines/tab-bars · https://developer.apple.com/design/human-interface-guidelines/sheets · https://developer.apple.com/design/human-interface-guidelines/modality
- Apple WWDC18, Designing Fluid Interfaces: https://developer.apple.com/videos/play/wwdc2018/803/
- Material 3, Navigation bar: https://m3.material.io/components/navigation-bar/guidelines
