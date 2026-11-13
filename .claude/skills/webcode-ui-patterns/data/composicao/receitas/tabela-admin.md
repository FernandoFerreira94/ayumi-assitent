---
id: tabela-admin
title: Tabela de gestão com filtros e ações em massa
summary: Cabeçalho com ação primária, contadores que filtram, tabela com busca, seleção e barra de ações, detalhe em painel.
intent: [tabela, listagem admin, crud, cadastro de clientes, produtos, filtros, ações em massa, backoffice]
group: gestao
platform: web
products: [admin, erp, crm, saas, b2b, logistics]
components: [page-header, button, filter-counters, data-table, badge, dropdown-menu, sheet, pagination, empty, skeleton, sonner, alert-dialog]
patterns: [sortable-data-table, bulk-selection-bar, filter-chips]
status: stable
---
## Quando usar
Lista operacional com 20+ registros que a pessoa filtra, edita e exporta. Poucos itens: `item` em card.

## Estrutura
```
page-header: título + total | "Exportar" (outline) + "Novo cliente" (primária)
filter-counters: Todos 1.240 · Ativos · Inadimplentes · Inativos
data-table: busca + filtros por coluna + colunas ocultáveis; selectable; bulkActions
   linha: nome (rowHeader) · status (badge) · valor (numeric) · menu … no fim
pagination com resumo "1–50 de 1.240"
sheet lateral para ver/editar (?id=)
```

## Comandos perto do contexto
- Criar no `page-header`; ação da linha no menu … (`dropdown-menu`) da própria linha.
- Ações em massa aparecem no lugar da busca quando há seleção ("3 selecionados · Exportar · Arquivar").
- Editar em `sheet` com Salvar no rodapé do painel.

## Material e movimento
Tabela dentro de card só se a página tiver outros blocos; senão, solta. Densidade do tema (`row`). Sem animação além do hover da linha.

## Estados
`skeleton` das linhas na 1ª carga; filtros mantidos na URL. Vazio por filtro: `empty` com "Limpar filtros". Excluir em massa: `alert-dialog` com a quantidade; excluir 1 reversível: `sonner` com Desfazer.

## Evitar
Ações de linha só no hover; paginação e rolagem infinita juntas; filtros num modal; tabela sem variante de cards no celular.

## Variações
- Celular: linhas viram cards com o status no topo.
- Edição rápida: célula editável na linha (`inline-cell-edit`).
- Milhares de linhas: `data-table` virtual sem paginação.

## Esqueleto
```tsx
<PageHeader><PageHeaderContent><PageHeaderTitle/></PageHeaderContent>
  <PageHeaderActions><Button variant="outline"/><Button>Novo cliente</Button></PageHeaderActions></PageHeader>
<FilterCounters/>
<DataTable data columns getRowId caption="Clientes" selectable bulkActions={(rows, clear) => …}/>
<Pagination/>
<Sheet open={!!id}><SheetContent side="right">…<SheetFooter><Button>Salvar</Button></SheetFooter></SheetContent></Sheet>
```
