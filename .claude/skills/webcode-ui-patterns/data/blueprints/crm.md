---
id: crm
title: CRM de vendas
family: Produto e gestão
summary: Funil de vendas B2B ou consultivas, com pipeline em kanban, contatos, empresas e atividades. O vendedor precisa saber o que fazer agora.
kpi: Taxa de conversão por etapa do funil e atividades registradas por vendedor por dia
themes: [clean-saas]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, list-enter-exit, copy-feedback, top-progress-bar, ios-switch, side-sheet-detail, anchored-popover, confirm-alert-dialog, cpf-cnpj-field, form-error-summary, filter-chips, bulk-selection-bar, kpi-stat-card, collapsible-sidebar, url-tabs, undo-delete, status-banner, async-button-states, ai-action-approval, bar-ranking, bullet-goal, conversion-funnel, product-tour, app-top-bar, dropdown-menu-button, priority-plus-nav, login-split-screen, signup-multi-step, password-recovery-flow, file-upload-dropzone, kanban-board, chat-thread, notification-center]
density: comfortable
radius: 8
components: [button, input, field, select, combobox, data-table, tabs, sheet, dialog, alert-dialog, command, dropdown-menu, popover, tooltip, sonner, skeleton, badge, avatar, card, sidebar, calendar, chart, tour]
status: stable
---

## Objetivo
Transformar a rotina do vendedor em uma lista de próximos passos e dar ao gestor previsão de receita confiável. Registro de atividade tem que ser mais rápido que anotar no papel.

## Navegação
- Sidebar: Hoje, Negócios (pipeline), Contatos, Empresas, Atividades, Relatórios, Configurações.
- ⌘K busca contato, empresa e negócio e cria qualquer um deles.
- Detalhe de registro em sheet lateral a partir de listas e do kanban, com URL própria.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Hoje | tarefas vencendo, follow-ups atrasados, reuniões do dia, negócios parados há X dias | empty-state, list-enter-exit |
| Pipeline | kanban por etapa com valor total por coluna, arrastar entre etapas **e** menu "Mover para" | toast-stack (desfazer) |
| Negócio | valor, etapa, probabilidade, próxima atividade, linha do tempo (e-mails, ligações, notas, WhatsApp) | skeleton-shimmer |
| Contato / empresa | dados, CNPJ que preenche razão social e endereço, negócios ligados, histórico | copy-feedback |
| Relatórios | funil com conversão entre etapas, previsão por mês, ranking por vendedor | — |

## Regras
- Todo negócio aberto tem uma próxima atividade com data. Sem ela, ele aparece como "sem próximo passo".
- Registrar atividade em até 2 interações: atalho, tipo pré-selecionado, data padrão "hoje".
- Kanban: card com nome, valor (`tabular-nums`), dias na etapa e avatar do responsável. Nada mais.
- Arrastar entre etapas tem alternativa por menu (WCAG 2.5.7) e desfazer no toast.
- Valores em R$ com total por coluna fixo no topo da coluna.
- Integrações (e-mail, WhatsApp, telefone) registram no histórico sozinhas; o vendedor só confirma.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, pipeline, criar negócio e registrar atividade; dados de exemplo no funil. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS; o acento da marca do cliente só em ação primária e etapa ativa.
- **Densidade:** confortável no kanban e no detalhe, compacta nas listas de contatos.
- **Componentes-chave:** DataTable com filtros salvos, Sheet de detalhe, Command, Calendar, Combobox de responsável, Chart de funil.

## Estados críticos
- Pipeline vazio: explica etapas e oferece importar planilha ou criar o primeiro negócio.
- Duplicidade de contato/empresa (mesmo e-mail/CNPJ): sugere mesclar.
- Negócio perdido: pede motivo em lista curta (preço, concorrente, timing), essencial para relatório.
- Meta do mês: progresso visível no Hoje.

## Anti-padrões
- Formulário de 30 campos para criar um negócio.
- Kanban com cards que exigem abrir para ver o valor.
- Relatório que o gestor precisa exportar para entender.

## Referências
- Salesforce Lightning Design System: https://www.lightningdesignsystem.com/
- HubSpot Canvas Design System: https://canvas.hubspot.com/
- NN/g, Kanban e drag-and-drop: https://www.nngroup.com/articles/drag-drop/
