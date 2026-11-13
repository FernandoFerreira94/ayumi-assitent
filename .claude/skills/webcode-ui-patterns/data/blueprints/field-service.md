---
id: field-service
product: field-service
title: App de campo e ordens de serviço (OS)
family: Serviços e verticais
summary: App do técnico que sai para instalar, manter ou vistoriar. Funciona sem sinal, cabe numa mão de luva, registra prova (foto, assinatura, checklist) e fecha a OS no local.
kpi: OS concluídas no primeiro atendimento e tempo entre chegada e fechamento da OS
themes: [clean-saas, axion, custelo, aurora]
patterns: [ios-tab-bar, ios-stack-navigation, mobile-search-screen, extended-fab-scroll, offline-action-queue, connection-status, card-modal-sheet, action-sheet, mobile-keyboard-form, permission-priming, swipe-row-actions, pull-to-refresh, skeleton-shimmer, large-title-collapse, segmented-control, progress-stepper, toast-stack, undo-delete, empty-state, file-upload-dropzone, time-slot-picker, kanban-board, order-tracking, chat-thread]
density: comfortable
radius: 12
components: [button, card, badge, drawer, sheet, dialog, alert-dialog, tabs, field, input, textarea, checkbox, radio-group, switch, sonner, skeleton, empty, file-upload, page-header]
status: beta
---

## Objetivo
O técnico abre o app, vê as visitas do dia em ordem, chega, executa o checklist com fotos, colhe a assinatura e fecha a OS, mesmo no subsolo sem sinal. O escritório vê o andamento em tempo real quando a conexão volta.

## Navegação
- Tab bar: **Hoje**, **Agenda**, **Ordens** (busca), **Perfil**. Hoje é a tela inicial.
- Pilha dentro de cada aba: lista → OS → checklist/equipamento/histórico (gesto de voltar e botão com o título anterior).
- Criar OS avulsa e registrar ocorrência abrem em modal em cartão; foto e anexo em action sheet (câmera, galeria).

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Hoje | visitas em ordem de rota, status (agendada, em rota, em execução, concluída), próxima em destaque com Ligar e Abrir no mapa | large-title-collapse, pull-to-refresh, skeleton-shimmer |
| OS | cliente, endereço, janela de horário, equipamento, histórico, botão de estado ("Iniciar deslocamento" → "Cheguei" → "Iniciar serviço" → "Finalizar") | ios-stack-navigation, progress-stepper |
| Checklist | itens obrigatórios com foto quando exigido, medições com teclado numérico, observações | mobile-keyboard-form, action-sheet |
| Fechamento | resumo, peças usadas, assinatura do cliente (canvas), nome e documento de quem assinou, envio do relatório por WhatsApp/e-mail | card-modal-sheet, toast-stack |
| Ordens | busca por número, cliente ou equipamento, filtros por estado | mobile-search-screen, segmented-control, swipe-row-actions |
| Sincronização | fila de envio, falhas com motivo e "Tentar de novo" | offline-action-queue, connection-status |

## Regras
- Offline primeiro: agenda do dia, checklists e histórico baixados ao abrir; toda ação entra em fila com id único e sincroniza sozinha.
- Botão de estado único, grande e no rodapé; o próximo estado é óbvio. Voltar um estado pede motivo.
- Foto com data, hora e localização gravadas nos metadados (não na imagem); compressão antes de enviar.
- Campos de medição com `inputmode="decimal"` e unidade ao lado ("psi", "°C").
- Alvos de 48px ou mais e contraste alto: uso com luva, sol e pressa.
- Localização e câmera pedidas no primeiro uso, com explicação (padrão `permission-priming`). Rastreamento só durante o expediente e visível ao técnico (LGPD).
- Assinatura: botão Limpar, confirmação do nome, e alternativa por código enviado ao cliente quando ele não estiver presente.

## Recomendações
- **Tema:** Clean SaaS (legível ao sol, sem vidro sobre conteúdo); Aurora se o app também for usado pelo cliente final.
- **Densidade:** confortável; listas de 60–64px; botão de estado com 56px.
- **Componentes-chave:** Drawer/Sheet, Tabs (segmentado), File Upload (fotos), AlertDialog, Empty.
- **Plataforma:** PWA atende (câmera, geolocalização, offline). Expo se precisar de rastreamento em segundo plano, Bluetooth (medidores) ou push garantido no iOS.

## Estados críticos
- Sem sinal: faixa discreta com quantas ações estão na fila; nada bloqueia o trabalho.
- Conflito ao sincronizar (OS cancelada ou reagendada pelo escritório): item marcado com o motivo e escolha do que fazer.
- Bateria baixa: reduzir sincronização e avisar antes de perder fotos não enviadas.
- Sessão expirada no campo: pedir login sem perder a fila local.

## Anti-padrões
- Exigir conexão para abrir a OS ou salvar o checklist.
- Formulário longo numa tela só, com teclado escondendo o botão.
- Spinner bloqueando a tela enquanto envia fotos.
- Rastrear localização fora do expediente ou sem aviso.

## Referências
- web.dev, Offline UX design guidelines: https://web.dev/articles/offline-ux-design-guidelines
- Workbox, Background Sync: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync
- Apple HIG, Navigation and search e Privacy: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search · https://developer.apple.com/design/human-interface-guidelines/privacy
- ANPD, Guia de LGPD para agentes de tratamento: https://www.gov.br/anpd/pt-br
