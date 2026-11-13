---
id: admin
title: Admin interno e backoffice simples
family: Produto e gestão
summary: Painel para a equipe operar o próprio produto (usuários, pedidos, conteúdo, suporte). Correto e seguro vale mais que bonito.
kpi: Tempo para resolver um caso de suporte e incidentes causados por erro de operação
themes: [clean-saas]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, copy-feedback, top-progress-bar, ios-switch, side-sheet-detail, confirm-alert-dialog, anchored-popover, sortable-data-table, bulk-selection-bar, filter-chips, collapsible-sidebar, breadcrumb-overflow, url-tabs, status-banner, undo-delete, async-button-states, line-chart-crosshair, bar-ranking, product-tour, app-top-bar, dropdown-menu-button, login-split-screen, password-recovery-flow, two-factor-challenge, footer-minimal, pagination-numbered, notification-center]
density: compact
radius: 6
components: [button, input, field, select, combobox, data-table, table, tabs, sheet, dialog, alert-dialog, command, dropdown-menu, tooltip, sonner, skeleton, badge, sidebar, breadcrumb, pagination, switch, tour]
status: stable
---

## Objetivo
Permitir que qualquer pessoa da equipe encontre um registro em segundos, entenda o estado dele e aja sem quebrar nada.

## Navegação
- Sidebar por entidade (Usuários, Organizações, Pedidos, Assinaturas, Conteúdo, Logs, Configurações).
- Busca global por ID, e-mail, CPF/CNPJ e nº do pedido, que abre o registro direto se houver um só resultado.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Lista de entidade | DataTable compacta, filtros na URL, exportar | skeleton-shimmer, empty-state |
| Detalhe | cabeçalho com status e IDs copiáveis, abas (Dados, Atividade, Relacionados, Auditoria) | copy-feedback |
| Ação sensível | reembolso, bloqueio, impersonar: alert dialog com motivo obrigatório | toast-stack |
| Logs / auditoria | quem fez o quê e quando, com filtro por pessoa e entidade | — |
| Feature flags | switches com efeito imediato, ambiente e descrição | ios-switch |

## Regras
- IDs, e-mails e chaves sempre copiáveis com um clique.
- Ações destrutivas ou financeiras pedem motivo e ficam na auditoria. Impersonar mostra faixa fixa "Você está vendo como Maria" com sair.
- Ambiente sempre visível (faixa ou cor no header em staging) para ninguém operar produção achando que é teste.
- Dados pessoais mascarados por padrão (CPF `***.456.789-**`), revelar registra na auditoria (LGPD).
- Permissões por papel; botão sem permissão aparece desabilitado com tooltip dizendo quem pode.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, só para áreas sensíveis (permissões, auditoria); equipe interna costuma preferir o estilo flutuante. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS, sem variação. Acento neutro (azul ou o da marca, dessaturado).
- **Densidade:** compacta (linhas de 36px), fonte 14px.
- **Componentes-chave:** DataTable, Sheet de detalhe, AlertDialog com campo de motivo, Command, Breadcrumb.

## Estados críticos
- Registro não encontrado por ID: sugere busca parcial.
- Operação em massa: prévia de quantos registros serão afetados antes de executar.
- Conflito: registro alterado por outra pessoa enquanto você editava.

## Anti-padrões
- Admin gerado direto do banco com nomes de coluna (`created_at`, `usr_tp`).
- Excluir sem auditoria.
- Mesmo visual para produção e staging.

## Referências
- Shopify Polaris (admin): https://polaris-react.shopify.com/
- Atlassian Design System: https://atlassian.design/
- GitHub Primer, padrões de produto: https://primer.style/product/
