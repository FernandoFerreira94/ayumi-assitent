---
id: pdv-caixa
title: Frente de caixa (PDV)
summary: Busca e grade de produtos à esquerda, comanda com quantidades e total à direita, pagamento em diálogo com Pix, cartão ou dinheiro e troco.
intent: [pdv, caixa, ponto de venda, frente de caixa, comanda, balcão]
group: comercio
platform: web
products: [pos, ecommerce, delivery]
components: [resizable, input-group, kbd, toggle-group, product-card, item, quantity-stepper, button, dialog, amount-pad, qr-code, sonner, empty]
patterns: [pix-copy-paste]
status: beta
---
## Quando usar
Venda rápida no balcão, em tablet ou desktop com leitor de código. Pedido do cliente no próprio celular: `produto-mobile` + `carrinho-mobile`.

## Estrutura
```
resizable (2 painéis, tela inteira, sem rolagem da página)
  esquerda: input-group de busca/código (foco sempre volta) + kbd F2 · toggle-group de categorias
            grade de product-card compactos (toque = +1)
  direita (comanda): item por produto (nome · quantity-stepper · subtotal) + desconto
            rodapé fixo: total grande + "Cobrar R$ 84,90" (F9)
dialog Pagamento: toggle-group Pix · Crédito · Débito · Dinheiro
   Pix: qr-code · Dinheiro: amount-pad "Recebido" + troco calculado
```

## Comandos perto do contexto
- Quantidade e remover na própria linha da comanda; "Limpar venda" discreto no topo da comanda, com Desfazer.
- Cobrar no rodapé da comanda; atalhos de teclado visíveis com `kbd`.
- Imprimir/enviar cupom no fim do pagamento; venda concluída vira `sonner` "Venda #312 · R$ 84,90 · Desfazer" e a comanda zera.

## Material e movimento
Alvo grande (`--wc-density-control-lg`) para toque; cards sem hover elaborado. Item novo entra na comanda com destaque curto (fundo `accent` que some). Pagamento aprovado: check único, sem confete.

## Estados
Comanda vazia: `empty` "Leia um código ou toque num produto". Produto sem estoque: card desabilitado com motivo. Pix aguardando: QR `status="loading"` → confirmado fecha sozinho. Offline: faixa avisando que vendas em dinheiro ficam na fila.

## Evitar
Modal para cada item adicionado; total pequeno; tirar o foco do leitor após cobrar; teclado do sistema para valor recebido.

## Variações
- Restaurante: comanda por mesa (toggle-group de mesas) e "Enviar à cozinha" antes de cobrar.
- Tablet retrato: comanda vira `drawer` com resumo fixo embaixo.
- Self-service: só grade + carrinho, pagamento Pix direto.

## Esqueleto
```tsx
<ResizablePanelGroup direction="horizontal" className="h-dvh">
  <ResizablePanel><InputGroup>…<Kbd>F2</Kbd></InputGroup><ToggleGroup type="single"/>
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"><ProductCard/>…</div></ResizablePanel>
  <ResizableHandle/>
  <ResizablePanel defaultSize={35}><Item><ItemContent/><ItemActions><QuantityStepper/></ItemActions></Item>
    <Button size="lg" className="w-full">Cobrar R$ 84,90</Button></ResizablePanel></ResizablePanelGroup>
<Dialog><DialogContent><AmountPad/><QRCode value={pix}/></DialogContent></Dialog>
```
