---
id: vitrine-produtos
title: Vitrine de produtos com filtros
summary: Grade de cards de produto com filtros na lateral (web) ou em gaveta (celular), ordenação no topo e carregar mais.
intent: [vitrine, catálogo, listagem de produtos, categoria, loja, resultados de busca de produto, cardápio]
group: comercio
platform: ambos
products: [ecommerce, marketplace, b2b, delivery]
components: [product-card, price-tag, badge, checkbox, slider, select, drawer, button, load-more, empty, skeleton, swap]
patterns: [load-more-infinite, filter-chips]
status: stable
---
## Quando usar
Categoria ou resultado com 12+ produtos. Poucos itens em destaque: `carousel` em landing.

## Estrutura
```
topo: título + "248 produtos" | select de ordenação · (celular) button "Filtros (2)" → drawer
web: coluna de filtros 240px (checkbox de marca, slider de preço) | grade 2–4 col
chips dos filtros ativos acima da grade, cada um removível + "Limpar"
grade de product-card: foto, nome (2 linhas), price-tag, badge (−20%, Frete grátis), favoritar
load-more com "Mostrando 24 de 248"
```

## Comandos perto do contexto
- Filtro ativo removível no chip, onde a pessoa vê o efeito.
- Ordenar ao lado da contagem; Filtros no celular abre `drawer` com "Ver 248 produtos" no rodapé.
- Favoritar no canto da foto; comprar só na página do produto.

## Material e movimento
Cards sem sombra forte (o produto é a cor); pressão no toque. Itens novos do carregar mais com fade curto. Card → detalhe: `@webcode/view-transition` leva a foto (elemento compartilhado); filtro troca a grade com `swap`. Filtro aplica na hora no desktop; no drawer, aplica ao confirmar.

## Estados
`skeleton` com a forma do card. Sem resultado: `empty` com o filtro mais restritivo e "Remover". Esgotado: card com badge e foto esmaecida.

## Evitar
Paginação numerada em loja mobile; mais de 3 badges por card; filtros que recarregam a página inteira; botão Comprar em cada card de moda.

## Variações
- Celular: filtros em folha (`filtros-mobile`).
- Marketplace: loja/vendedor e frete grátis no card.
- Catálogo B2B: preço por quantidade e "Adicionar" com `quantity-stepper` na grade.

## Esqueleto
```tsx
<div className="flex items-center justify-between"><h1/><Select/><Button variant="outline" className="lg:hidden">Filtros (2)</Button></div>
<div className="grid lg:grid-cols-[240px_1fr] gap-6">
  <aside className="max-lg:hidden"><Checkbox/>…<Slider/></aside>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"><ProductCard>…<ProductCardPrice/></ProductCard></div>
</div>
<LoadMore/>
<Drawer>…<DrawerFooter><Button>Ver 248 produtos</Button></DrawerFooter></Drawer>
```
