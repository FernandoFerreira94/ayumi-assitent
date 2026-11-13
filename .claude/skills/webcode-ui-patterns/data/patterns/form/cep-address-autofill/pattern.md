---
id: cep-address-autofill
title: CEP que preenche o endereço
category: form
summary: Ao completar os 8 dígitos do CEP, busca rua, bairro, cidade e UF, preenche os campos e leva o foco para Número. Se a busca falhar, os campos continuam editáveis e a mensagem explica.
themes: [clean-saas, aurora, editorial, playful]
products: [ecommerce, marketplace, subscription, delivery, b2b, erp, crm, health, booking, logistics]
motion: low
tech: css-js
deps: []
a11y: Status da busca em role="status" ("Buscando endereço…", "Endereço encontrado"); campos preenchidos continuam editáveis; foco vai para Número só depois do preenchimento; autocomplete postal-code e address-line1.
perf: Uma requisição por CEP completo, com cache em memória e cancelamento (AbortController) se o CEP mudar antes da resposta.
reference_name: web.dev (Address form best practices)
reference_url: https://web.dev/articles/payment-and-address-form-best-practices
react: Use react-hook-form + setValue após a busca; consulte o CEP pelo seu backend (ViaCEP, BrasilAPI ou base própria) para não depender de CORS e ter fallback.
status: stable
---

## Quando usar
- Checkout, cadastro com endereço, cálculo de frete, agendamento domiciliar.

## Evite
- Bloquear o formulário se a busca falhar.
- Esconder os campos de rua e bairro até a busca terminar sem alternativa ("Não sei meu CEP").
- Pedir o CEP depois da rua (a ordem natural no Brasil é CEP primeiro).

## Implementação
- Máscara `00000-000`, `inputmode="numeric"`; a busca dispara no 8º dígito, não no blur.
- Indicador de carregando dentro do campo; campos preenchidos recebem um destaque curto (`accent-soft` em `fast`).
- Cache por CEP e `AbortController` ao digitar de novo.
- O demo usa uma base local de exemplo; em produção, chame o seu backend.
