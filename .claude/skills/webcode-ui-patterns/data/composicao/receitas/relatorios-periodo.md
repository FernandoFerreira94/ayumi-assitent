---
id: relatorios-periodo
title: Relatório por período com comparativo
summary: Período e comparação no topo, números-chave, gráfico com troca de métrica e tabela detalhada exportável com o mesmo filtro.
intent: [relatório, relatórios, análise, comparativo, exportar, vendas por período]
group: gestao
platform: web
products: [saas, erp, crm, admin, ecommerce]
components: [page-header, date-picker, toggle-group, stat-card, line-chart, bar-chart, data-table, dropdown-menu, button, skeleton, empty]
patterns: [kpi-stat-card, line-chart-crosshair, bar-ranking]
status: stable
---
## Quando usar
Responder "como foi o período X comparado ao anterior" e levar os dados para fora. Visão do dia a dia: `painel-kpis`. Movimento financeiro: `extrato-financeiro`.

## Estrutura
```
page-header: título | `date-picker` de intervalo + select "comparar com" (período anterior · ano passado) + Exportar (dropdown: CSV, Excel, PDF)
linha de stat-card (3–4): valor + delta vs comparação
card gráfico: toggle-group da métrica (Receita · Pedidos · Ticket) + line-chart (atual sólido, comparação tracejada)
card ranking: bar-chart horizontal (top 10 produtos/vendedores)
data-table detalhada (mesmo filtro), com total na última linha
```

## Comandos perto do contexto
- Período, comparação e Exportar no `page-header`; o filtro vale para a página inteira e vai para a URL.
- Trocar a métrica dentro do card do gráfico.
- Clicar numa barra filtra a tabela abaixo (com chip "Produto: X ×").

## Material e movimento
Cards `default` em grade; gráfico desenha uma vez na entrada (respeita movimento reduzido). Cores das séries pelos tokens de gráfico, comparação em `muted`. Delta: seta + sinal + cor, nunca só cor.

## Estados
`skeleton` no formato de cada card. Sem dados: `empty` dentro do card do gráfico, não da página inteira. Exportação grande: toast "Gerando arquivo… avisaremos" e link quando pronto.

## Evitar
Pizza com 8 fatias; eixo Y sem unidade; exportar algo diferente do que está na tela; 12 KPIs no topo.

## Variações
- Relatório agendado: botão "Enviar toda segunda" com e-mail e formato.
- Mobile: stat-card em `carousel`, gráfico em largura total e tabela vira lista.
- Comparação por segmento: toggle-group Loja · Canal · Vendedor muda o agrupamento.

## Esqueleto
```tsx
<PageHeader>…<PageHeaderActions><DateRangePicker/><DropdownMenu><DropdownMenuTrigger asChild>
  <Button variant="outline">Exportar</Button></DropdownMenuTrigger>…</DropdownMenu></PageHeaderActions></PageHeader>
<div className="grid gap-4 md:grid-cols-4"><StatCard label="Receita" value="R$ 92 mil" delta={0.12} period="vs set"/>…</div>
<Card><CardHeader><ToggleGroup type="single"/></CardHeader><LineChart data index="dia" series/></Card>
<Card><BarChart orientation="horizontal" data index="produto" series/></Card>
<DataTable data columns caption="Vendas por dia"/>
```
