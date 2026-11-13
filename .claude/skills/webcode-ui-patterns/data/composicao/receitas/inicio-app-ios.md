---
id: inicio-app-ios
title: Início do app (home iOS)
summary: Título grande com saudação, um card de destaque do que importa agora, atalhos em grade e listas curtas em grupos; tab-bar embaixo.
intent: [home do app, tela inicial, início, dashboard mobile, atalhos, resumo da conta]
group: app
platform: mobile
products: [mobile-app, fintech, delivery, health, booking]
components: [navigation-bar, pull-to-refresh, card, carousel, page-control, list-group, avatar, badge, tab-bar, skeleton, notification-banner, whats-new]
patterns: [large-title-collapse, ios-tab-bar, pull-to-refresh]
status: stable
---
## Quando usar
Primeira aba de um app: mostrar o estado e levar à próxima ação em um toque. Painel web: `painel-kpis`. Hábitos/saúde: `resumo-habitos`.

## Estrutura
```
navigation-bar large "Olá, Ana" + avatar (abre conta) à direita
pull-to-refresh envolve o conteúdo
card de destaque (1): saldo/pedido em andamento/próxima consulta + 1 ação
grade 4 atalhos (ícone + rótulo curto): Pix · Pagar · Cobrar · Cartões
carousel de ofertas/avisos (máx. 3) + page-control
list-group inset "Recentes" (3 linhas + "Ver tudo")
tab-bar (4–5 abas)
```

## Comandos perto do contexto
- A ação do momento mora no card de destaque ("Acompanhar pedido", "Pagar fatura").
- Atalhos são as 4 ações mais usadas; o resto vai para uma aba, não para um "Mais" na home.
- "Ver tudo" no rodapé do grupo, não no título.

## Material e movimento
Título grande que encolhe ao rolar; tab-bar em vidro sobre o conteúdo. Toque nos atalhos com mola curta de escala. Valores sensíveis com olho para esconder (lembra a escolha).

## Estados
Primeira carga: `skeleton` do card e da lista no layout real. Atualizando: indicador do `pull-to-refresh`, conteúdo antigo visível. Erro de rede: `notification-banner` "Sem conexão · mostrando dados de 10:42". Versão nova: `whats-new` uma vez.

## Evitar
Home com 10 seções; banner promocional acima do saldo; atalhos sem rótulo; badge em toda aba.

## Variações
- Delivery: card de destaque com pedido ao vivo (live-island) e carrossel de lojas.
- Saúde/agenda: próxima consulta + `week-strip` no topo.
- Sem login: home pública com vitrine e "Entrar" na navigation-bar.

## Esqueleto
```tsx
<NavigationBar title="Olá, Ana" large trailing={<Avatar/>}/>
<PullToRefresh onRefresh={reload}>
  <Card><CardContent>Saldo R$ 2.340,10</CardContent><CardFooter><Button>Pix</Button></CardFooter></Card>
  <div className="grid grid-cols-4 gap-2">…atalhos</div>
  <Carousel>…</Carousel><PageControl count={3}/>
  <ListGroup variant="inset" title="Recentes"><ListRow title="Mercado" detail="− R$ 54,90" accessory="chevron"/></ListGroup>
</PullToRefresh>
<TabBar>…<TabBarItem/></TabBar>
```
