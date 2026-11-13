---
id: pix-copy-paste
title: Pagamento Pix com QR e copia e cola
category: commerce
summary: Tela de pagamento Pix com QR Code (desktop), código copia e cola em destaque com botão Copiar (mobile primeiro), contagem regressiva da validade, passo a passo curto e status que muda sozinho de "Aguardando pagamento" para "Pagamento confirmado".
themes: [aurora, clean-saas, editorial, playful]
products: [ecommerce, marketplace, delivery, subscription, fintech, booking, event, pos]
motion: low
tech: css-js
deps: []
a11y: QR com texto alternativo e o código também em texto; botão Copiar anuncia "Código Pix copiado"; contagem regressiva em role="timer" sem anunciar cada segundo (só aos 5 min e ao expirar); confirmação em role="status" e foco no título do sucesso.
perf: Status por SSE ou polling com backoff (3s → 10s) que para quando a aba fica oculta; QR gerado no servidor junto com o payload EMV (BR Code).
reference_name: Banco Central do Brasil (Pix, manual de padrões para iniciação)
reference_url: https://www.bcb.gov.br/estabilidadefinanceira/pix
react: Componente PixPayment com payload, expiresAt e status vindo de useQuery com refetchInterval; copiar via copy-feedback.
status: stable
---

## Quando usar
- Checkout com Pix, cobrança por link, PDV com QR na tela do cliente.

## Evite
- Só QR no mobile: a pessoa já está no celular; o copia e cola vem primeiro.
- Código truncado sem forma de ver e copiar inteiro.
- Pedir para o usuário "voltar e clicar em já paguei": detecte sozinho.

## Implementação
- Ordem no mobile: valor → Copiar código → como pagar → QR (recolhido). No desktop: QR ao lado do código.
- Expirou: explique e ofereça "Gerar novo código" sem perder o pedido.
- O demo usa um QR ilustrativo; em produção use o QR gerado a partir do payload do PSP.
