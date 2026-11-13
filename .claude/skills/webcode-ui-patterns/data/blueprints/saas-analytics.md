---
id: saas-analytics
product: saas
title: Dashboard analítico
family: Produto e gestão
summary: Produto cujo valor é o dado (analytics, BI leve, métricas de marketing ou vendas). Perguntas claras, período global e gráficos que se explicam.
kpi: Usuários que voltam ao dashboard semanalmente e relatórios compartilhados
themes: [clean-saas, aurora]
patterns: [command-palette, skeleton-shimmer, toast-stack, empty-state, copy-feedback, top-progress-bar, bento-grid, anchored-popover, kpi-stat-card, filter-chips, sortable-data-table, segmented-control, line-chart-crosshair, bar-ranking, bullet-goal, conversion-funnel, calendar-heatmap, product-tour, app-top-bar, dropdown-menu-button, login-split-screen, footer-saas-columns, notification-center]
density: comfortable
radius: 8
components: [button, select, popover, calendar, tabs, card, chart, data-table, dropdown-menu, tooltip, sonner, skeleton, badge, sheet, dialog, toggle-group, sidebar, tour]
status: stable
---

## Objetivo
Responder em 5 segundos "como estamos?" e em 1 minuto "por quê?". Tudo o mais é detalhe.

## Estrutura
- Header da página com seletor de período global (Hoje, 7d, 30d, Mês, Personalizado) e comparação ("vs período anterior"), ambos na URL.
- Linha de 3–5 KPIs → gráfico principal → quebras (por canal, produto, região) → tabela detalhada.
- Dashboards salvos e compartilháveis por link; agendamento de envio por e-mail.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Visão geral | KPIs com variação, série temporal principal, top 5 de cada dimensão | skeleton-shimmer, bento-grid |
| Exploração | escolher métrica e dimensão, filtros como chips, gráfico + tabela sincronizados | — |
| Relatório salvo | título que diz a conclusão, notas, compartilhar, exportar | copy-feedback |
| Alertas | regras ("receita caiu 20% vs média"), canal de aviso | toast-stack |
| Fontes de dados | conexões, última sincronização, erros | empty-state |

## Regras
- Siga `guidelines/data-viz.md`: gráfico certo para a pergunta, eixo zero em barras, rótulo direto, tooltip com valor exato.
- KPI sempre clicável para a quebra que o compõe.
- Período e filtros iguais para todos os blocos da tela; um bloco com filtro próprio mostra isso explicitamente.
- "Atualizado há X" e fonte do dado em cada dashboard.
- Bento grid só na visão geral; exploração usa layout linear.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, mostre filtro de período, um gráfico e onde salvar a visão; nada de explicar cada KPI. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS; Aurora para produtos de analytics vendidos a times de marketing/criadores, com gráficos em `gradient-*`.
- **Densidade:** confortável nos cards, compacta nas tabelas.
- **Componentes-chave:** Chart, Card de KPI, Calendar em Popover para período, ToggleGroup de granularidade (dia/semana/mês), DataTable.

## Estados críticos
- Sem dados ainda: mostrar dados de exemplo rotulados e o passo para conectar a fonte.
- Sincronização atrasada ou com erro: faixa no topo com horário do último dado bom.
- Período sem dados: mensagem no gráfico, não eixo vazio.

## Anti-padrões
- 12 gráficos na primeira tela.
- Pizza com 9 fatias e donut de "progresso" decorativo.
- Cores diferentes para a mesma métrica em gráficos diferentes.

## Referências
- Stephen Few, Perceptual Edge: https://www.perceptualedge.com/
- IBM Carbon, Data visualization: https://carbondesignsystem.com/data-visualization/getting-started/
