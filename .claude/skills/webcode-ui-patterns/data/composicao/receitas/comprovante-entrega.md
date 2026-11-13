---
id: comprovante-entrega
title: Assinatura de recebimento (canhoto digital)
summary: Conferir os itens, quem recebeu, assinatura e foto opcional; confirma com data, hora e local e entrega um comprovante com código de conferência.
intent: [assinatura de recebimento, comprovante de entrega, canhoto, canhoto digital, assinar entrega, prova de entrega, POD, recebi o produto, termo de recebimento]
group: comercio
platform: ambos
products: [delivery, logistics, field-service, ecommerce, erp]
components: [delivery-receipt, signature-pad, camera-capture, input-document, drawer, list-group, share-sheet, description-list]
patterns: []
status: beta
---
## Quando usar
Provar que alguém recebeu um produto: entrega na porta, retirada no balcão, almoxarifado, OS concluída. Use `delivery-receipt`; só a assinatura solta (contrato, aceite, vistoria) é `signature-pad`.

## Estrutura
```
resumo: Entrega #4821 · 2 itens · 3 volumes · endereço, itens com quantidade
1 Conferir: Recebi tudo certo | Recebi com ressalva → textarea "O que houve" (obrigatória com ressalva)
2 Quem recebeu: nome (preenchido com o destinatário), vínculo em pílulas (Destinatário, Familiar, Portaria, Vizinho, Outro), CPF ou RG
3 Assinatura: signature-pad com Digitar e a frase de declaração
4 Foto (opcional ou obrigatória): camera-capture, com "Confirmar sem foto" quando opcional
Confirmar recebimento → DeliveryProof (assinatura, CPF mascarado, ressalva, local, código, Compartilhar, Imprimir ou PDF)
```

## Comandos perto do contexto
- Web, balcão ou tablet: `variant="card"`, tudo à vista e um Confirmar no fim.
- App do entregador: `variant="fullscreen"`, uma etapa por tela, botão grande embaixo e a assinatura ocupando o espaço.
- A partir de uma lista de paradas: `variant="sheet"` com "Entregar" na linha (`list-group`); confirmada, a parada vai para Entregues com Ver comprovante.

## Material e movimento
Sólido (o comprovante pede contraste). Ressalva desliza curta, ✓ com escala, nada se move durante a assinatura. Vidro na folha só sobre mapa ou foto.

## Estados
Salvando (spinner), erro ao salvar (mantém tudo), sem permissão de local (o comprovante diz), sem câmera (app de câmera), ressalva (selo na lista e no comprovante).

## Evitar
CPF inteiro no comprovante ou no texto compartilhado; botão Confirmar desabilitado sem dizer o que falta; área de assinatura menor que 120px; arrastar a folha fechando no meio do traço; pedir local ao abrir a tela; tratar o código do aparelho como prova (vale o registro no servidor).

## Variações
- Documento: `document="off" | "optional" | "required"` e `documentType="cpf" | "rg"`.
- Foto: `photo="off" | "optional" | "required"`.
- Tela inteira do entregador com a lista: bloco `tela-entregas`.

## Esqueleto
```tsx
<DeliveryReceipt delivery={pedido} variant="fullscreen" photo="required" captureLocation onConfirm={salvar} />
<DeliveryReceipt delivery={pedido} variant="sheet" open={aberto} onOpenChange={setAberto} trigger={<Button>Entregar</Button>} onConfirm={salvar} />
<DeliveryProof receipt={comprovante} />
<SignaturePad /><CameraCapture /><InputDocument accept="cpf" />
<Drawer /><ListGroup /><ShareSheet /><DescriptionList />
```
