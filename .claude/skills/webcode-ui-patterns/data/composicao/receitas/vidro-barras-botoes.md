---
id: vidro-barras-botoes
title: Vidro só em barras e botões (app e PWA)
summary: Vidro flutua sobre o conteúdo nas barras e nos botões; o conteúdo fica sólido. Web com glass-group/tab-bar, Expo com @webcode/native-glass.
intent: [vidro, liquid glass, glass, efeito de vidro, ios 26, expo-glass-effect, barra de vidro, botão de vidro, glassmorphism no app]
group: app
platform: ambos
products: [mobile-app, delivery, booking, health, fintech]
components: [tab-bar, navigation-bar, glass-group, bottom-toolbar, fab, button, list-group, card]
patterns: [ios-tab-bar]
status: beta
---
## Quando usar
App ou PWA com foto, mapa, vídeo ou lista rolando por baixo das barras. O vidro mostra que a barra flutua e que há conteúdo atrás. Tela de formulário ou tabela densa: sem vidro.

## Estrutura
```
navigation-bar (vidro só ao rolar)
conteúdo sólido: list-group / card / mídia
glass-group sobre a mídia (voltar | compartilhar · favoritar · mais)
tab-bar flutuante (vidro regular, lente sólida) + TabBarAction
```

## Comandos perto do contexto
- Ações da mídia em `glass-group` no canto dela; ações da tela em `bottom-toolbar`.
- Uma ação principal tingida por tela (`button` com `variant="glass-prominent"` ou `prominent` no grupo); as outras no vidro neutro.
- Criar algo novo: `fab` com `material="glass"` acima da tab bar.

## Material e movimento
Barras em vidro regular, menus e sheets em espesso, ícone sobre foto no fino. Efeito `liquid` em controles flutuantes. No Expo, `GlassBar`/`GlassButton`/`GlassGroup` do `@webcode/native-glass`: Liquid Glass no iOS 26, blur no iOS antigo, cor do token no Android. Fusão do grupo com a mola do tema.

## Estados
Reduzir transparência: tudo sólido (o tema e a lib já fazem). Sem desfoque: o token continua legível. Rolagem no topo: barra de navegação transparente; com conteúdo por baixo, vidro.

## Evitar
Vidro em card, linha de lista, formulário ou texto longo; vidro dentro de vidro; mais de ~3 vidros visíveis; tinta em todos os botões; `clear` com texto.

## Variações
- PWA: `glass-group merged` no topo da foto e `tab-bar minimizeOnScroll`.
- Expo iOS 26: `GlassGroup spacing` funde os botões próximos com a animação do sistema.

## Esqueleto
```tsx
<NavigationBar title="Praia do Forte" />
<ListGroup>…</ListGroup>
<GlassGroup aria-label="Ações da foto"><GlassGroupItem label="Compartilhar"><ShareIcon /></GlassGroupItem></GlassGroup>
<TabBar fixed><TabBarItem label="Início" icon={<HouseIcon />} active /></TabBar>
// Expo
<GlassThemeProvider theme={aurora}><GlassBar><GlassButton label="Buscar" icon={<Search />} /></GlassBar></GlassThemeProvider>
```
