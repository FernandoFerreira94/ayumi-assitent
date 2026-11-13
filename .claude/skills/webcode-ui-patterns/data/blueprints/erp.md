---
id: erp
title: ERP e backoffice
family: Produto e gestão
summary: Sistema operacional da empresa (pedidos, estoque, fiscal, financeiro). Precisão e produtividade em jornadas de 8 horas.
kpi: Tempo por tarefa operacional (ex. emitir pedido, conciliar extrato) e taxa de erro de lançamento
themes: [clean-saas]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, top-progress-bar, press-spring-button, copy-feedback, ios-switch, list-enter-exit, side-sheet-detail, confirm-alert-dialog, anchored-popover, cpf-cnpj-field, currency-brl-input, form-error-summary, sortable-data-table, bulk-selection-bar, filter-chips, kpi-stat-card, inline-cell-edit, collapsible-sidebar, breadcrumb-overflow, url-tabs, status-banner, undo-delete, async-button-states, line-chart-crosshair, bar-ranking, bullet-goal, product-tour, app-top-bar, dropdown-menu-button, login-split-screen, signup-multi-step, password-recovery-flow, two-factor-challenge, pagination-numbered, file-upload-dropzone, notification-center]
density: compact
radius: 6
components: [button, input, field, select, combobox, data-table, table, tabs, sheet, alert-dialog, command, dropdown-menu, tooltip, sonner, skeleton, badge, sidebar, breadcrumb, pagination, calendar, tour]
status: stable
---

## Objetivo
Reduzir cliques, digitação e erro. Quem usa ERP faz a mesma tarefa 200 vezes por dia: cada segundo economizado vale mais que qualquer efeito.

## Módulos típicos
| Módulo | Telas-chave | Cuidados |
| --- | --- | --- |
| Vendas / pedidos | lista, novo pedido, detalhe, status | atalhos para criar e buscar, duplicar pedido |
| Estoque | produtos, movimentações, inventário | leitura de código de barras, alertas de mínimo |
| Fiscal | NF-e/NFC-e, rejeições SEFAZ | mensagens de rejeição traduzidas, contingência |
| Financeiro | contas a pagar/receber, conciliação, fluxo de caixa | valores tabulares, sinal +/- claro, totais fixos |
| Cadastros | clientes, fornecedores | CNPJ/CEP preenchem dados automaticamente |
| Relatórios | filtros, exportação | exportação em background com toast "pronto" |

## Regras
- **Teclado primeiro**: Tab segue a ordem de digitação, Enter avança, atalhos para salvar (⌘S) e novo (N). Paleta de comandos obrigatória.
- Tabelas densas (36–40px por linha) com colunas configuráveis, filtros salvos e totais no rodapé.
- Formulários longos em seções com âncoras, não em wizard, para usuários experientes.
- Máscaras brasileiras: CPF/CNPJ, CEP, telefone, moeda com vírgula decimal e datas dd/mm/aaaa.
- Status com cor semântica + texto + ícone. Nunca só cor (daltonismo e impressão).
- Sem animação decorativa. Movimento só para feedback (salvo, erro, carregando).
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, por perfil (financeiro, estoque, vendas): só os módulos que aquele usuário usa; novidades de versão no estilo flutuante. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Estados críticos
- Rejeição fiscal com motivo e ação de correção.
- Conflito de edição simultânea ("Rafael alterou este pedido há 1 min").
- Operação offline no PDV com fila de sincronização visível.
- Exportações grandes em background.

## Anti-padrões
- Esconder ações frequentes em menus de três pontos.
- Paginação de 10 itens em listas que o usuário precisa varrer.
- Modal de confirmação em toda ação (use desfazer).
