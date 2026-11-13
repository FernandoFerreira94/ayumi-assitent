---
id: lista-pedidos-ios
title: Lista de pedidos no iPhone
summary: Lista densa com título grande, busca, filtro segmentado, deslizar para agir e Desfazer no lugar de confirmação.
intent: [lista de pedidos, lista mobile, inbox, caixa de entrada, lista no iphone, deslizar para apagar, swipe, ordens de serviço, lista com status]
group: app
platform: mobile
products: [mobile-app, delivery, ecommerce, field-service, logistics]
components: [navigation-bar, search-bar, toggle-group, swipe-actions, badge, pull-to-refresh, tab-bar, button, sonner, skeleton, empty]
patterns: [ios-tab-bar, undo-delete]
status: stable
---
## Quando usar
Lista aberta várias vezes ao dia para conferir e agir rápido (pedidos, OS, mensagens). Linhas que abrem ajustes: `list-group`. Mais de 4 colunas de dado: tabela.

## Estrutura
```
navigation-bar large "Pedidos" (trailing: button "+")
└─ children: search-bar + toggle-group segmented (Todos · Abertos · Entregues)
pull-to-refresh > ul > li > swipe-actions
   leading "Lido" (accent) · trailing "Excluir" (danger) + "Arquivar"
   linha: cliente + hora | #número · resumo (muted) + badge + valor tabular
tab-bar fixed minimizeOnScroll (3 a 5 destinos)
```

## Comandos perto do contexto
- Ação da linha = gesto na linha (`swipe-actions`), com botões reais para teclado.
- Criar no trailing da `navigation-bar`; se criar é a ação do app, `TabBarAction`.
- Filtro colado à busca, no topo.
- Excluir sem confirmar: some e `sonner` "Pedido #1042 excluído · Desfazer".

## Material e movimento
Barras em vidro (já vêm); lista sólida, sem card por linha; nada de vidro dentro das barras. Mola só no gesto; linha excluída recolhe a altura (base). Linha ≥ 44px (`--wc-mobile-control-*`).

## Estados
`skeleton` de 6 linhas reais; `empty` por filtro com "Ver todos"; erro no refresh mantém a lista + `sonner` "Tentar de novo"; novos chegando: aviso "2 novos" no topo, sem empurrar a leitura.

## Evitar
Modal antes de excluir o que dá para desfazer; card por linha; mais de 3 ações por lado; gesto como única forma; `bottom-bar` junto da `tab-bar`; status só por cor.

## Variações
- Web: `tabela-admin` ou `lista-com-detalhe`.
- Entregador: lista por rota com "Iniciar" na linha.
- Aprovações: deslizar Aprovar/Recusar com Desfazer.

## Esqueleto
```tsx
<NavigationBar large title="Pedidos" trailing={<Button variant="ghost" size="icon" aria-label="Novo pedido"/>}>
  <SearchBar cancel="focus"/>
  <ToggleGroup type="single" variant="segmented"><ToggleGroupItem/></ToggleGroup>
</NavigationBar>
<PullToRefresh onRefresh={reload}><ul className="border-t">
  <li><SwipeActions leading={[...]} trailing={[{ label: "Excluir", tone: "danger", destructive: true }]}>
    <a className="flex flex-col px-4 py-3">…<Badge variant="success"/>…</a>
  </SwipeActions></li>
</ul></PullToRefresh>
<TabBar fixed minimizeOnScroll/>
```
