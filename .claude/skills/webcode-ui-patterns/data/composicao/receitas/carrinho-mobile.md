---
id: carrinho-mobile
title: Carrinho e pagamento no celular
summary: Itens com stepper na linha, total sempre visível na barra de baixo e Pix com QR e copia-e-cola.
intent: [carrinho, sacola, checkout mobile, pagar no celular, pix mobile, delivery pedido]
group: comercio
platform: mobile
products: [ecommerce, delivery, marketplace, mobile-app]
components: [navigation-bar, swipe-actions, quantity-stepper, price-tag, bottom-bar, list-group, qr-code, copy-button, countdown, sonner, empty, presence-list]
patterns: [undo-delete]
status: stable
---
## Quando usar
Fechar pedido no app (delivery, loja). Desktop: `checkout-web`.

## Estrutura
```
navigation-bar "Sacola"
lista de itens: foto + nome + preço | quantity-stepper (lixeira no 1) — swipe-actions "Remover"
list-group inset: Entrega (select-list) · Pagamento (Pix/Cartão) · Cupom
bottom-bar sticky keyboard="lift": total (price-tag sm) + button "Pagar"
tela Pix: qr-code + copy-button do código + countdown de expiração
```

## Comandos perto do contexto
- Quantidade na própria linha; remover pelo stepper no mínimo ou pelo gesto.
- Total e Pagar no `bottom-bar`, sempre visíveis.
- Escolhas (entrega, pagamento) em linhas de `list-group` que mostram o valor atual.

## Material e movimento
Lista sólida; `bottom-bar` sólido (vidro só sobre mídia). Número do stepper rola; item removido recolhe a altura (`presence-list`) e o `sonner` oferece Desfazer. Copiar dá `hud` ou `sonner` "Código Pix copiado".

## Estados
Vazio: `empty` "Sua sacola está vazia" + "Ver cardápio". Item indisponível: linha com badge e fora do total. Pix expirado: QR com estado expirado + "Gerar novo".

## Evitar
`tab-bar` junto do `bottom-bar`; confirmar remoção em modal; total só no fim da rolagem; QR sem copia-e-cola.

## Variações
- Delivery: taxa e tempo de entrega no resumo, cupom em linha própria.
- Retirada na loja: `toggle-group` Entrega · Retirada no topo.
- Pix expirado: `countdown` vira "Gerar novo código".

## Esqueleto
```tsx
<NavigationBar title="Sacola"/>
<ul><li><SwipeActions trailing={[{ label: "Remover", tone: "danger", destructive: true }]}>
  <div className="flex gap-3 p-4">…<QuantityStepper/></div></SwipeActions></li></ul>
<ListGroup variant="inset"><ListRow title="Pagamento" detail="Pix" accessory="chevron"/></ListGroup>
<BottomBar keyboard="lift"><BottomBarSummary label="Total"><PriceTag size="sm"/></BottomBarSummary><Button>Pagar</Button></BottomBar>
// Pix: <QRCode/> <CopyButton/> <Countdown/>
```
