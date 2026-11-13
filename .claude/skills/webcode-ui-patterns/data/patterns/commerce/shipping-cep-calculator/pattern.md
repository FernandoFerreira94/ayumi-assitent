---
id: shipping-cep-calculator
title: Calcular frete e prazo por CEP
category: commerce
summary: Campo de CEP na página de produto e no carrinho que calcula ao completar 8 dígitos, mostra opções (retirada, econômica, expressa) com preço e data estimada por extenso, lembra o CEP e trata CEP inválido, sem cobertura e erro do serviço.
themes: [aurora, clean-saas, editorial, playful]
products: [ecommerce, marketplace, b2b, delivery, subscription]
motion: low
tech: css-js
deps: []
a11y: Input com inputmode="numeric", autocomplete="postal-code" e máscara que não atrapalha o leitor; resultado em role="status" ("3 opções de entrega para 01310-100"); opções como radio group; link "Não sei meu CEP" para os Correios.
perf: Calcula ao completar 8 dígitos (sem botão obrigatório) com AbortController para cancelar a consulta anterior; CEP guardado em localStorage com try/catch e reaproveitado no checkout.
reference_name: Baymard Institute (Shipping costs and delivery dates)
reference_url: https://baymard.com/blog/delivery-date-instead-of-speed
react: Field de CEP do @webcode (ver cep-address-autofill) + RadioGroup; consulta via route handler que chama o serviço de frete.
status: stable
---

## Quando usar
- Página de produto e carrinho de lojas que cobram frete. Frete surpresa no checkout é a maior causa de abandono.

## Evite
- "5 a 8 dias úteis" sem data: mostre "chega até qui., 6 de nov.".
- Pedir CEP de novo no checkout se já foi informado.
- Botão "OK" obrigatório para calcular.

## Implementação
- Ordene por data e destaque a mais barata e a mais rápida.
- Sem cobertura: diga e ofereça retirada ou aviso ("Avise quando entregarmos aqui").
- Data estimada calculada pulando fins de semana e feriados nacionais.
