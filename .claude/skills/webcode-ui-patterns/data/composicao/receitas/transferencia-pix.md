---
id: transferencia-pix
title: Transferência e Pix no celular
summary: Valor grande digitado pelos centavos, destinatário confirmado com nome e banco, revisão em uma tela e comprovante.
intent: [pix, transferir, pagar, enviar dinheiro, carteira, fintech mobile, comprovante]
group: financeiro
platform: mobile
products: [fintech, mobile-app]
components: [navigation-bar, amount-pad, avatar, list-group, bottom-bar, button, input-otp, result, copy-button, share-sheet, hud]
patterns: []
status: stable
---
## Quando usar
Enviar dinheiro no app. Cobrar (receber): `carrinho-mobile` (QR + copia-e-cola).

## Estrutura
```
1 Para quem: busca de chave/contato → linha com avatar, nome mascarado e banco para conferir
2 Valor: amount-pad (dígitos pelos centavos) + saldo disponível + atalhos (R$ 50, 100)
3 Revisão: list-group inset (Para · Banco · Valor · Data) + bottom-bar "Transferir R$ 120,00"
4 Senha/biometria: input-otp ou nativo
5 Comprovante: result de sucesso + copy-button do ID + share-sheet
```

## Comandos perto do contexto
- Editar cada dado na própria linha da revisão (toque volta à etapa).
- Transferir no `bottom-bar` com o valor no rótulo.
- Compartilhar e copiar no comprovante.

## Material e movimento
Valor grande com fonte display, `tabular-nums`. Limite estourado: tremida curta no valor + texto do limite. Sucesso: check desenhado uma vez; copiar dá `hud` "Copiado".

## Estados
Saldo insuficiente: botão desabilitado com o motivo no texto. Chave não encontrada: erro na busca. Falha: `result` de erro com "Tentar de novo" e o dinheiro não saiu (diga isso).

## Evitar
Confirmar em modal pequeno; esconder o nome do destinatário; teclado do sistema para valor; botão Transferir sem o valor.

## Variações
- Pix agendado/recorrente: data + repetição na revisão.
- Pix Copia e Cola/QR lido: valor e destinatário já preenchidos, só revisão.
- Boleto: leitura do código de barras + data de vencimento e juros na revisão.

## Esqueleto
```tsx
<NavigationBar title="Transferir"/>
<AmountPad value={cents} onValueChange={setCents} max={saldo}/>
<ListGroup variant="inset"><ListRow icon={<Avatar/>} title="Ana S." subtitle="Nubank · ***.123.456-**"/></ListGroup>
<BottomBar><Button className="w-full">Transferir R$ 120,00</Button></BottomBar>
// Fim: <Result status="success" title="Pix enviado"/> <CopyButton/> <ShareSheet/>
```
