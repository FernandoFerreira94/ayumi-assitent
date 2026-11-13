---
id: painel-kpis
title: Painel de KPIs com detalhe ao lado
summary: Indicadores com período no topo, explicação do cálculo a um toque e detalhe em painel lateral sem sair da tela.
intent: [dashboard, painel, kpi, indicadores, métricas, visão geral, resumo financeiro, home do admin]
group: gestao
platform: web
products: [saas, erp, crm, admin, fintech]
components: [page-header, toggle-group, stat-card, popover, sheet, line-chart, data-table, skeleton, empty, number-ticker, dropdown-menu, stagger, swap]
patterns: [kpi-stat-card, side-sheet-detail, line-chart-crosshair]
status: stable
---
## Quando usar
Primeira tela de produto de gestão: "como estamos" em 5 s e descer para o detalhe de um número. 3 a 6 KPIs; mais que isso, `stat-card` compact num segundo bloco.

## Estrutura
```
page-header: título + "Atualizado há 2 min" | toggle-group segmented (7d · 30d · 12m) + menu …
grade stat-card (2 col celular, 4 desktop): href="?kpi=id", ⓘ → popover "Como calculamos"
card > line-chart da métrica principal
sheet right (?kpi=id): título + valor/delta > line-chart + data-table das linhas do número
```

## Comandos perto do contexto
- Período no `page-header`, um só para a página.
- O `stat-card` inteiro abre o detalhe (href); sem "Ver mais".
- Explicação no ⓘ com `popover` (clique e teclado), não hover.
- Exportar/personalizar no menu … (`dropdown-menu`).
- Detalhe em `sheet` com estado na URL.

## Material e movimento
Card com href ganha hover interactive (sobe 2px, base). Uma cor de destaque; variação por `goodWhen` com seta e sinal. `number-ticker` só no número-herói da 1ª carga, nunca ao trocar período. `sheet` desliza; o fundo não se move. 1ª carga: a grade entra com `stagger` e o gráfico vem depois (`delay`); trocar período usa `swap` no gráfico, sem reanimar a grade.

## Estados
`stat-card loading` + `skeleton` do gráfico; header aparece na hora. Sem dados: `empty` no card do gráfico com "Ver 30 dias". Valor abreviado com `exactValue`. Erro num KPI: "—" + "Tentar de novo", os outros seguem.

## Evitar
Pizza com mais de 4 fatias; gauge sem meta; 6 cores de destaque; período por card; modal central para o detalhe; contagem animada em todo filtro; cálculo só em tooltip.

## Variações
- Mobile: `stat-card` em `carousel` e gráfico em largura total.
- Metas: `usage-meter` por meta com aviso aos 80%.
- Tempo real: atualização silenciosa com "atualizado há 1 min".

## Esqueleto
```tsx
<PageHeader><PageHeaderContent><PageHeaderTitle/><PageHeaderDescription/></PageHeaderContent>
  <PageHeaderActions><ToggleGroup type="single" variant="segmented"/></PageHeaderActions></PageHeader>
<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
  <StatCard label value exactValue delta goodWhen trend href="?kpi=receita" loading/>
</div>
<Sheet open={!!kpi}><SheetContent side="right"><SheetHeader><SheetTitle/></SheetHeader>
  <SheetBody><LineChart showLastValue/><DataTable caption/></SheetBody></SheetContent></Sheet>
```
