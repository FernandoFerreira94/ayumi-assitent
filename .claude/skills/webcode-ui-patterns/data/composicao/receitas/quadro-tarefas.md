---
id: quadro-tarefas
title: Quadro de tarefas (kanban)
summary: Colunas por status com contagem e limite, cards compactos e detalhe em painel lateral; arrastar com alternativa por teclado.
intent: [kanban, quadro, tarefas, pipeline de vendas, funil, status de pedidos, board]
group: gestao
platform: web
products: [saas, crm, helpdesk, field-service, logistics]
components: [page-header, filter-counters, kanban, card, avatar, badge, sheet, button, empty, sonner]
patterns: [kanban-board]
status: stable
---
## Quando usar
Itens que andam por 3 a 7 etapas e a pessoa move com frequência. Mais análise que movimento: `tabela-admin`.

## Estrutura
```
page-header: título | filtros (responsável, etiqueta) + "Nova tarefa"
kanban: coluna = título + contagem (+ limite WIP) + "+" no topo
   card compacto: título (2 linhas) · badge de etiqueta · avatar · prazo
clique no card → sheet right com detalhe e comentários
```

## Comandos perto do contexto
- Criar dentro da coluna (o "+" já define o status).
- Mover arrastando ou por teclado (Espaço, setas, Esc); menu … do card com "Mover para".
- Editar no `sheet`, sem sair do quadro.

## Material e movimento
Colunas em bg-muted, cards em bg-card com sombra mínima. Card arrastado ganha sombra e escala leve (mola do tema); coluna destino destaca. Mover dá `sonner` com Desfazer quando sai de "Concluído".

## Estados
Coluna vazia: área tracejada "Solte aqui". WIP estourado: contagem em aviso (texto + cor). Quadro vazio: `empty` com "Nova tarefa".

## Evitar
Mais de 7 colunas; card com descrição inteira; formulário de criação em modal grande; arrastar como única forma de mover.

## Variações
- Funil de vendas (CRM): valor somado no topo de cada coluna e motivo de perda ao mover para Perdido.
- Ordem de serviço: colunas por técnico, badge de SLA no card.
- Celular: uma coluna por vez com `toggle-group` de status no topo.

## Esqueleto
```tsx
<PageHeader>…<PageHeaderActions><FilterCounters/><Button>Nova tarefa</Button></PageHeaderActions></PageHeader>
<Kanban columns={columns} onCardMove={save} renderCard={(t) => <Card className="p-3">…<Badge/><Avatar/></Card>}/>
<Sheet open={!!id}><SheetContent side="right">…</SheetContent></Sheet>
```
