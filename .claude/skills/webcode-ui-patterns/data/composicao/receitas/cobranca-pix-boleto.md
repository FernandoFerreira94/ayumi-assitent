---
id: cobranca-pix-boleto
title: Emitir cobrança Pix ou boleto
summary: Painel lateral para cobrar um cliente por CPF/CNPJ, com valor, vencimento e forma; entrega QR, copia-e-cola e link.
intent: [cobrança, gerar pix, boleto, link de pagamento, cobrar cliente, receber]
group: financeiro
platform: web
products: [saas, erp, fintech, b2b]
components: [sheet, field, input-document, input-currency, date-picker, toggle-group, qr-code, copy-button, badge, button, sonner]
patterns: [pix-copy-paste, cpf-cnpj-field, currency-brl-input]
status: stable
---
## Quando usar
Backoffice cobra alguém (fatura avulsa, mensalidade). Pagar no checkout: `checkout-web`/`carrinho-mobile`. Lista das cobranças: `tabela-admin` + este painel.

## Estrutura
```
sheet lateral "Nova cobrança"
  1 Cliente: input-document (CPF/CNPJ, valida e mostra o tipo) → nome/razão social preenchidos
  2 Valor: input-currency · Vencimento: date-picker (min hoje) · Descrição curta
  3 Forma: toggle-group Pix · Boleto · Pix + boleto
  (accordion opcional "Juros, multa e desconto")
  rodapé: total + "Gerar cobrança"
→ mesmo painel vira resultado: qr-code + copia-e-cola + linha digitável + link
```

## Comandos perto do contexto
- "Gerar cobrança" no rodapé do painel, com o valor no rótulo.
- No resultado: copy-button ao lado de cada código, "Enviar por WhatsApp/e-mail" e "Nova cobrança".
- Cancelar cobrança emitida: menu da linha na lista, com `popconfirm`.

## Material e movimento
Painel `sheet` com Salvar fixo no rodapé. QR com `status` (loading → active; expirado com `onRefresh`). Copiar troca o ícone por check (sem toast extra).

## Estados
CPF/CNPJ inválido: erro no `field` ao sair do campo, nunca enquanto digita. Gerando: botão `loading` e QR `status="loading"`. Falha no banco: mensagem no painel, dados preservados. Sucesso: `sonner` "Cobrança criada · Ver".

## Evitar
Pedir o tipo de documento antes (o campo detecta); vencimento no passado; QR sem o copia-e-cola; fechar o painel ao gerar (a pessoa precisa copiar).

## Variações
- Recorrente: switch "Repetir todo mês" + dia do vencimento; badge "Assinatura" na lista.
- Link de pagamento sem cliente: só valor + descrição; quem paga informa o CPF.
- Parcelado no boleto: select de parcelas com valor de cada uma.

## Esqueleto
```tsx
<Sheet><SheetContent side="right"><SheetHeader><SheetTitle>Nova cobrança</SheetTitle></SheetHeader>
  <Field><FieldLabel>CPF ou CNPJ</FieldLabel><InputDocument onValueChange={(v, info) => …}/><FieldError/></Field>
  <Field><FieldLabel>Valor</FieldLabel><InputCurrency/></Field> <Field><FieldLabel>Vencimento</FieldLabel><DatePicker min={hoje}/></Field>
  <ToggleGroup type="single"><ToggleGroupItem value="pix">Pix</ToggleGroupItem>…</ToggleGroup>
  <SheetFooter><Button>Gerar cobrança de R$ 250,00</Button></SheetFooter></SheetContent></Sheet>
// Resultado: <QRCode value={pix} status="active"/> <CopyButton value={pix}/> <Badge>Aguardando</Badge>
```
