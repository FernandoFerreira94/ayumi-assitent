---
id: lista-com-detalhe
title: Lista com detalhe ao lado
summary: Lista navegável à esquerda e detalhe do item ao lado, com estado na URL; no celular o detalhe vira tela empilhada.
intent: [mestre detalhe, master detail, lista e detalhe, caixa de entrada web, tickets, clientes, inbox, detalhe ao lado]
group: gestao
platform: web
products: [crm, helpdesk, erp, admin, saas]
components: [resizable, input-group, item, badge, avatar, relative-time, scroll-area, description-list, timeline, button, dropdown-menu, empty, skeleton, sheet, presence-list]
patterns: [side-sheet-detail]
status: stable
---
## Quando usar
Triagem: abrir item após item sem perder a lista (tickets, clientes, pedidos). Se o detalhe é raro, use `data-table` + `sheet`.

## Estrutura
```
resizable horizontal (autoSaveId)
├─ painel lista (30%): input-group de busca + filtros → scroll-area de item
│  item: avatar + nome + resumo (truncate) | relative-time + badge de status
└─ painel detalhe (70%): header (título + ações) → description-list → timeline de atividade
celular: lista em tela; detalhe empilhado com voltar
```

## Comandos perto do contexto
- Ações do item no header do detalhe: 1 primária ("Responder") + menu … (`dropdown-menu`).
- Ações rápidas na linha (arquivar) reveladas no hover, sempre com atalho.
- Navegar j/k e Enter; estado `?id=` na URL.

## Material e movimento
Painéis sem card (bordas do resizable bastam). Linha selecionada em `bg-accent`; nada de sombra. Troca de item instantânea; sem deslize. Arquivar na lista: `presence-list` + `sonner` com Desfazer (vizinhos sobem juntos).

## Estados
Nenhum selecionado: `empty` no detalhe ("Escolha um ticket"). Carregando detalhe: `skeleton` do header + 4 linhas. Lista vazia por filtro: `empty` com "Limpar filtros".

## Evitar
Modal para o detalhe; abrir o detalhe em outra página quando a pessoa tria em série; card por linha; ações só no hover sem atalho.

## Variações
- Helpdesk: `timeline` do ticket e resposta no rodapé do detalhe.
- CRM: detalhe com abas (Resumo · Negócios · Atividades).
- E-mail/caixa: ações em massa na lista ao selecionar.

## Esqueleto
```tsx
<ResizablePanelGroup direction="horizontal" autoSaveId="tickets">
  <ResizablePanel defaultSize={30}><InputGroup/><ScrollArea>
    <Item asChild><a href="?id=42"><Avatar/><ItemContent><ItemTitle/><ItemDescription/></ItemContent>
      <ItemActions><RelativeTime/><Badge/></ItemActions></a></Item></ScrollArea></ResizablePanel>
  <ResizableHandle/>
  <ResizablePanel><header>…<Button/></header><DescriptionList/><Timeline/></ResizablePanel>
</ResizablePanelGroup>
```
