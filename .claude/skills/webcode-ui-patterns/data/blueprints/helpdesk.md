---
id: helpdesk
title: Helpdesk e central de ajuda
family: Produto e gestão
summary: Tickets com fila, SLA e macros para a equipe, e central de ajuda pública para o cliente se resolver sozinho.
kpi: Tempo de primeira resposta, tempo de resolução e taxa de autoatendimento (deflexão)
themes: [clean-saas, editorial]
patterns: [command-palette, toast-stack, empty-state, skeleton-shimmer, list-enter-exit, copy-feedback, glass-sticky-header, side-sheet-detail, anchored-popover, filter-chips, bulk-selection-bar, collapsible-sidebar, status-banner, undo-delete, connection-status, ai-streaming-response, ai-action-approval, swipe-row-actions, bullet-goal, calendar-heatmap, product-tour, app-top-bar, dropdown-menu-button, login-split-screen, pagination-numbered, file-upload-dropzone, kanban-board, chat-thread, notification-center]
density: compact
radius: 6
components: [button, input, textarea, field, select, combobox, data-table, tabs, sheet, dialog, dropdown-menu, popover, tooltip, sonner, skeleton, badge, avatar, sidebar, accordion, tour]
status: stable
---

## Objetivo
Para a equipe: zerar a fila sem perder o SLA. Para o cliente: achar a resposta antes de abrir um ticket.

## Duas faces
**Agente (app):** filas na sidebar (Minhas, Não atribuídos, Vencendo SLA, Aguardando cliente), lista de tickets compacta, ticket com conversa e painel lateral do cliente.
**Central de ajuda (site):** busca no topo, categorias, artigos com sumário, "Isso ajudou?" e contato no fim.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Fila | tickets com prioridade, SLA restante, canal, responsável; J/K para navegar | list-enter-exit |
| Ticket | conversa, nota interna, macros, campos (tipo, prioridade), tickets relacionados | copy-feedback, toast-stack |
| Cliente | plano, pedidos, tickets anteriores, satisfação | skeleton-shimmer |
| Central de ajuda | busca com sugestões, categorias, artigos populares | glass-sticky-header |
| Artigo | título, sumário, passos numerados com imagem, artigos relacionados, contato | — |

## Regras
- SLA restante em texto ("vence em 25 min"), com cor de alerta só nos últimos 20%.
- Macros com prévia e variáveis; aplicar macro não envia sem o agente ver.
- Status do ticket explícito e poucos (Aberto, Pendente, Resolvido, Fechado).
- Central de ajuda: busca tolera erro de digitação e sinônimos; sem resultado oferece contato já com a busca preenchida.
- Artigos escaneáveis: passos curtos, uma ação por passo, capturas com destaque.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, fila, atribuição e macros; não abra durante atendimento em andamento. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS no app do agente; Editorial na central de ajuda (leitura longa, tipografia forte).
- **Densidade:** compacta na fila, confortável no ticket e na central.
- **Componentes-chave:** DataTable, Sheet, Combobox de tags, Accordion para FAQs, Textarea com macros.

## Estados críticos
- Fila zerada: estado positivo, não vazio triste.
- Ticket mesclado ou duplicado: link para o principal.
- Cliente insatisfeito (CSAT baixo): destaque para gestor revisar.

## Anti-padrões
- Central de ajuda que esconde o contato.
- Formulário de ticket com 10 campos obrigatórios.
- Tickets fechados automaticamente sem aviso ao cliente.

## Referências
- NN/g, Help and documentation (heurística 10): https://www.nngroup.com/articles/help-and-documentation/
- GOV.UK, Contact a department: https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/
