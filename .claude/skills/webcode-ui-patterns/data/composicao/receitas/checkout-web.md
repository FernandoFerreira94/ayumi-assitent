---
id: checkout-web
title: Checkout em uma página
summary: Endereço, entrega e pagamento numa coluna com resumo fixo ao lado; Pix em destaque e erro no campo.
intent: [checkout, finalizar compra, pagamento, carrinho web, endereço e frete, pix e cartão]
group: comercio
platform: web
products: [ecommerce, subscription, marketplace, b2b]
components: [card, field, input, input-cep, input-document, radio-group, price-tag, button, separator, form-validation, alert, skeleton]
patterns: [form-error-summary, async-button-states]
status: stable
---
## Quando usar
Compra com 1 a 10 itens no desktop. Mobile: `carrinho-mobile`. Pagamento recorrente: `plano-assinatura`.

## Estrutura
```
grid 2 col (lg) → 1 col
├─ coluna principal: 3 card numerados (1 Identificação · 2 Entrega · 3 Pagamento)
│  ├─ field: input-document (CPF/CNPJ), input e-mail
│  ├─ field: input-cep → rua/número/complemento preenchidos; radio-group de frete (prazo + preço)
│  └─ radio-group de pagamento em cards: Pix (badge desconto) · Cartão · Boleto
└─ resumo sticky: itens, separator, price-tag do total, button "Pagar R$ 189,90"
```

## Comandos perto do contexto
- Botão de pagar no resumo, com o valor no rótulo; repetido no fim da coluna só no mobile.
- "Alterar" em cada card concluído (button link no header do card).
- Cupom dentro do resumo, recolhido ("Tenho cupom").

## Material e movimento
Cards default; o card ativo com borda forte, os concluídos viram resumo de uma linha. Sem animação além do botão em loading (`aria-busy`, largura fixa).

## Estados
Frete calculando: `skeleton` das opções. Erro: `form-validation` com resumo no topo e foco nele; erro de pagamento em `alert` dentro do card 3. Sucesso: página `result`.

## Evitar
Wizard em várias páginas para compra simples; criar conta obrigatória antes de pagar; total escondido até o fim; parcelas sem total; botão "Continuar" genérico.

## Variações
- Assinatura: plano e ciclo no resumo, sem frete.
- Retirada na loja: troca endereço por escolha de loja.
- Checkout de 1 página para quem já tem conta: só confirmar dados salvos.

## Esqueleto
```tsx
<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
  <div className="space-y-4">
    <Card><CardHeader><CardTitle>1 · Identificação</CardTitle></CardHeader>
      <CardContent><Field><FieldLabel/><InputDocument/><FieldError/></Field></CardContent></Card>
    <Card>…<InputCep/>…<RadioGroup/></Card>
    <Card>…<RadioGroup><RadioGroupItem value="pix"/></RadioGroup></Card>
  </div>
  <Card className="lg:sticky lg:top-6 self-start"><CardContent><PriceTag price={18990}/><Separator/></CardContent>
    <CardFooter><Button size="lg" className="w-full">Pagar R$ 189,90</Button></CardFooter></Card>
</div>
```
