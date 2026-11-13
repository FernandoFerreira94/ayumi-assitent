---
id: produto-mobile
title: Página de produto no celular
summary: Fotos que esticam no topo, preço com Pix logo abaixo, opções em linhas e compra fixa no rodapé.
intent: [página de produto, detalhe do produto, item do cardápio, produto mobile, pdp, comprar]
group: comercio
platform: mobile
products: [ecommerce, delivery, marketplace, mobile-app]
components: [stretchy-header, carousel, page-control, price-tag, badge, toggle-group, quantity-stepper, bottom-bar, list-group, spoiler, rating, image-viewer]
patterns: []
status: stable
---
## Quando usar
Detalhe de produto ou prato no app. Vitrine com vários itens: `vitrine-produtos`.

## Estrutura
```
stretchy-header com carousel de fotos + page-control (toque abre image-viewer)
nome + rating (leitura) + price-tag (Pix em destaque, parcelas)
variações: toggle-group (tamanho) · cor em pílulas
spoiler da descrição · list-group: Entrega › · Devolução ›
bottom-bar: quantity-stepper + button "Adicionar · R$ 49,90"
```

## Comandos perto do contexto
- Adicionar no `bottom-bar` com o preço no rótulo, atualizado com a quantidade.
- Favoritar e compartilhar na barra compacta do `stretchy-header`.
- Variação esgotada visível e desabilitada com o motivo.

## Material e movimento
Imagem estica ao puxar e vira barra em vidro com o nome. Fotos por scroll-snap. Adicionar: `sonner` "Adicionado à sacola · Ver sacola".

## Estados
Esgotado: `badge` + bottom-bar com "Avise-me". Carregando: forma da foto + 3 linhas. Sem avaliações: some o rating (não mostre 0 estrelas).

## Evitar
Preço só depois da descrição; variação escolhida num modal; dois botões de compra; carrossel com autoplay.

## Variações
- Cardápio: adicionais em `list-group` com check e limite ("escolha até 2") e observação.
- Variações de grade (cor/tamanho) com indisponível riscado.
- Serviço/curso: conteúdo em `spoiler` e "Agendar" no rodapé.

## Esqueleto
```tsx
<StretchyHeader title="Tênis Corrida"><Carousel><CarouselContent><CarouselItem/></CarouselContent></Carousel><PageControl/></StretchyHeader>
<h1/><Rating readOnly/><PriceTag price pixPrice installments/>
<ToggleGroup type="single" variant="outline"><ToggleGroupItem value="40"/></ToggleGroup>
<Spoiler/><ListGroup variant="inset"><ListRow title="Entrega" accessory="chevron"/></ListGroup>
<BottomBar><QuantityStepper/><Button className="flex-1">Adicionar · R$ 49,90</Button></BottomBar>
// <ImageViewer/> ao tocar na foto
```
