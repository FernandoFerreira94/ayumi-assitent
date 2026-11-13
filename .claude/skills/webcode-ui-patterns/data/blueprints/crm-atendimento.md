---
id: crm-atendimento
product: crm
title: CRM de atendimento e WhatsApp
family: Produto e gestão
summary: Inbox unificada (WhatsApp, Instagram, e-mail) com contatos, etiquetas e funil simples, para PME que vende pela conversa.
kpi: Tempo até a primeira resposta e conversão de conversa em venda
themes: [clean-saas, aurora]
patterns: [command-palette, toast-stack, empty-state, list-enter-exit, skeleton-shimmer, copy-feedback, bottom-sheet, ios-switch, side-sheet-detail, status-banner, connection-status, undo-delete, ai-streaming-response, ai-action-approval, swipe-row-actions, pull-to-refresh, product-tour, app-top-bar, dropdown-menu-button, login-split-screen, chat-thread, kanban-board, notification-center]
density: comfortable
radius: 10
components: [button, input, textarea, field, select, combobox, tabs, sheet, drawer, dialog, dropdown-menu, popover, tooltip, sonner, skeleton, badge, avatar, scroll-area, sidebar, tour]
status: stable
---

## Objetivo
Nenhuma conversa fica sem resposta e toda conversa vira um contato com contexto. O atendente trabalha num lugar só, inclusive pelo celular.

## Layout
- Desktop em três colunas: lista de conversas (filtros: minhas, não atribuídas, aguardando) · conversa · painel do contato.
- Mobile: lista → conversa em tela cheia; painel do contato em bottom sheet.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Inbox | conversas com canal, prévia, tempo de espera e responsável; não lidas em destaque | list-enter-exit, skeleton-shimmer |
| Conversa | mensagens, respostas rápidas (`/`), anexos, notas internas visualmente distintas, transferir | copy-feedback |
| Contato | dados, etiquetas, negócio/etapa, pedidos anteriores, histórico de canais | bottom-sheet (mobile) |
| Funil | etapas simples (Novo, Em negociação, Fechado) com contagem | toast-stack |
| Automação | horário de atendimento, mensagem de ausência, distribuição por fila | ios-switch |

## Regras
- Tempo de espera visível em cada conversa e cor de alerta só quando passa do SLA, sempre com texto ("há 12 min").
- Nota interna nunca pode parecer mensagem enviada: superfície diferente, rótulo "Nota interna" e ícone.
- Respostas rápidas com variáveis (`{nome}`) e prévia antes de enviar.
- Janela de 24h do WhatsApp explicada no campo de texto quando fecha ("Envie um modelo aprovado para retomar").
- Notificações por conversa nova respeitando a fila do atendente, sem som repetido.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, fila, assumir conversa e respostas rápidas; nunca abra por cima de uma conversa ativa. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS para operação; Aurora se o produto é vendido para criadores e lojas pequenas e precisa parecer moderno.
- **Densidade:** confortável; lista de conversas com linhas de 64–72px (avatar + 2 linhas).
- **Componentes-chave:** ScrollArea com âncora no fim, Textarea autoexpansível, Combobox de etiquetas, Drawer no mobile.

## Estados críticos
- Canal desconectado (QR do WhatsApp expirou): faixa persistente no topo com ação de reconectar.
- Mensagem não entregue: ícone na mensagem com tentar de novo.
- Fora do horário: indicador para o atendente e resposta automática configurada.

## Anti-padrões
- Misturar conversas de canais diferentes do mesmo contato sem indicar o canal.
- Atribuição automática sem o atendente ver quem está com a conversa.
- Esconder o histórico de pedidos em outra tela.

## Referências
- WhatsApp Business Platform, janela de atendimento e modelos: https://developers.facebook.com/docs/whatsapp/pricing/
- Intercom, Inbox design: https://www.intercom.com/help/en/articles/6522925-get-started-with-the-inbox
