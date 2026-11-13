---
id: filtros-mobile
title: Busca com filtros no celular
summary: Barra de busca no topo, chips dos filtros ativos, filtros em folha com detents e botão com a contagem de resultados.
intent: [filtros, ordenar, refinar busca, busca mobile, filtros no celular, resultados]
group: comercio
platform: mobile
products: [ecommerce, marketplace, realestate, delivery, booking]
components: [search-bar, badge, button, drawer, list-group, select-list, slider, switch, bottom-bar, empty, skeleton]
patterns: [mobile-search-screen, filter-chips, bottom-sheet]
status: stable
---
## Quando usar
Lista grande no celular que a pessoa refina (produtos, imóveis, restaurantes). Web: filtros na lateral (`vitrine-produtos`). Busca global no app: `busca-global`.

## Estrutura
```
search-bar (cancelar ao focar) + linha rolável de chips: "Filtros (3)" · Ordenar · chips ativos com ×
lista de resultados (skeleton na carga)
drawer com detents (0.5 → 1): título "Filtros" + "Limpar" à direita
   list-group inset: Ordenar (select-list push) · Categoria (select-list) · Preço (slider de faixa)
   list-group: switch "Entrega grátis", switch "Aceita Pix"
   bottom-bar: "Ver 128 resultados"
```

## Comandos perto do contexto
- Remover um filtro no × do próprio chip; "Limpar" no topo da folha.
- Aplicar no `bottom-bar` com a contagem atualizada a cada mudança.
- Ordenar abre direto a lista de opções (sem passar pela folha inteira).

## Material e movimento
Folha `drawer` com detents e arrasto com mola; fundo escurece só no detent cheio. Contagem do botão troca com transição de número curta. Chips com `badge` `secondary`.

## Estados
Contando resultados: botão mantém o número antigo + spinner pequeno. Zero resultados: botão desabilitado "Nenhum resultado" e sugestão de qual filtro soltar. Lista vazia após aplicar: `empty` com "Limpar filtros".

## Evitar
Aplicar a cada toque recarregando a lista atrás da folha; filtros em tela nova sem contagem; esconder filtros ativos; slider sem os valores escritos.

## Variações
- Poucos filtros (≤3): só chips toggláveis, sem folha.
- Imóveis: faixa de preço + quartos em `toggle-group` 1 · 2 · 3 · 4+.
- Mapa: resultados em `drawer` sobre o mapa com detent baixo mostrando a contagem.

## Esqueleto
```tsx
<SearchBar cancel="focus" onSearch={buscar}/>
<div className="flex gap-2 overflow-x-auto"><Button variant="secondary">Filtros (3)</Button><Badge>Pix ×</Badge></div>
<Drawer snapPoints={[0.5, 1]}><DrawerContent><DrawerHeader><DrawerTitle>Filtros</DrawerTitle></DrawerHeader>
  <DrawerBody><ListGroup variant="inset"><SelectList title="Ordenar" mode="push" options={ordens}/></ListGroup>
    <Slider defaultValue={[50, 400]}/><ListGroup><ListRow title="Aceita Pix" accessory={<Switch/>}/></ListGroup></DrawerBody>
  <BottomBar><Button className="w-full">Ver 128 resultados</Button></BottomBar></DrawerContent></Drawer>
```
