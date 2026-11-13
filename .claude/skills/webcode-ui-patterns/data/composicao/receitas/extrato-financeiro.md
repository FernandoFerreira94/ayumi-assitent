---
id: extrato-financeiro
title: Extrato e fluxo de caixa
summary: Saldo e totais do período no topo, extrato agrupado por dia com entradas e saídas, detalhe do lançamento em painel.
intent: [extrato, fluxo de caixa, transações, lançamentos, conciliação, contas a pagar]
group: financeiro
platform: ambos
products: [fintech, erp, saas, pos]
components: [page-header, date-picker, stat-card, filter-counters, data-table, badge, relative-time, sheet, description-list, button, empty, skeleton]
patterns: [filter-chips, kpi-stat-card]
status: stable
---
## Quando usar
Ver o que entrou e saiu num período e achar um lançamento. Enviar dinheiro: `transferencia-pix`. Análise com gráfico: `relatorios-periodo`.

## Estrutura
```
page-header: "Extrato" | `date-picker` de intervalo (DateRangePicker, atalhos: Hoje, 7 dias, Este mês) + "Exportar" (outline)
3 stat-card: Saldo · Entradas · Saídas (do período, com delta)
filter-counters: Tudo · Entradas · Saídas · Pendentes · Estornos
data-table agrupada por dia: cabeçalho do dia com saldo do fim do dia
   linha: descrição + forma (Pix, boleto, cartão) · categoria (badge) · valor (+ verde / − neutro, numeric)
sheet lateral do lançamento: description-list (ID, pagador com CPF mascarado, data, taxa, líquido)
```

## Comandos perto do contexto
- Período e Exportar no `page-header` (exporta o filtro atual, diga isso no menu).
- Na linha: menu … com Ver comprovante, Categorizar, Estornar.
- No painel: copiar ID (`copyValue` do `description-list`) e "Baixar comprovante".

## Material e movimento
Valores com `tabular-nums` e sinal explícito; saída não é vermelha (vermelho é erro/estorno). Datas recentes com `relative-time` ("há 2 h"), antigas por extenso. Painel entra com a duração do tema.

## Estados
`skeleton` dos cards e das linhas. Período sem lançamentos: `empty` "Nenhum lançamento entre 1 e 15/out" + trocar período. Pendente: badge `warning` com previsão ("cai amanhã").

## Evitar
Somar saldo de contas diferentes sem dizer; valor negativo só pela cor; extrato sem agrupar por dia; filtro de período escondido em modal.

## Variações
- Mobile: `list-group` por dia com cabeçalho fixo, valor à direita, detalhe em `drawer`.
- Contas a pagar/receber: filter-counters por vencimento (Vencidos · Hoje · 7 dias) e ação "Pagar" na linha.
- Conciliação: linha com dois lados (banco × sistema) e badge Conciliado/Divergente.

## Esqueleto
```tsx
<PageHeader><PageHeaderContent><PageHeaderTitle>Extrato</PageHeaderTitle></PageHeaderContent>
  <PageHeaderActions><DateRangePicker/><Button variant="outline">Exportar</Button></PageHeaderActions></PageHeader>
<div className="grid gap-4 md:grid-cols-3"><StatCard label="Saldo" value="R$ 18.420,00"/>…</div>
<FilterCounters/>
<DataTable data columns caption="Lançamentos"/>
<Sheet open={!!id}><SheetContent side="right"><DescriptionList columns={1}>
  <DescriptionItem label="ID" copyValue={tx.id}>{tx.id}</DescriptionItem></DescriptionList></SheetContent></Sheet>
```
