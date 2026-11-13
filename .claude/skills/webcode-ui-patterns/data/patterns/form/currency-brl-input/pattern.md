---
id: currency-brl-input
title: Campo de valor em reais (R$)
category: form
summary: Valor monetário digitado da direita para a esquerda (centavos primeiro), com R$ fixo, separadores brasileiros e prévia de parcelas. Aceita colar "1.234,56" ou "1234.56".
themes: [clean-saas, aurora, editorial]
products: [erp, fintech, pos, crm, saas, b2b, marketplace, admin]
motion: none
tech: css-js
deps: []
a11y: O prefixo R$ é visual e o rótulo diz a moeda; o valor lido pelo leitor de tela é o texto formatado; prévia de parcelas em role="status" polido; teclado numérico no celular.
perf: Intl.NumberFormat criado uma vez; formatação inteira no evento input, sem dependência.
reference_name: MDN (Intl.NumberFormat)
reference_url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
react: Guarde o valor em centavos (inteiro) no estado e formate só na exibição; nunca use float para dinheiro.
status: stable
---

## Quando usar
- Lançamentos financeiros, preço de produto, valor de Pix, desconto, meta.

## Evite
- `type="number"` (aceita "e", setas que mudam valor, vírgula inconsistente entre navegadores).
- Guardar o valor como float.
- Formatar só no blur sem retorno enquanto digita.

## Implementação
- Os dígitos digitados viram centavos: "1", "12", "123" → R$ 0,01 → 0,12 → 1,23.
- Colar com vírgula ou ponto decimal é interpretado pelo último separador.
- `inputmode="numeric"`, `font-variant-numeric: tabular-nums`, alinhado à direita em tabelas e à esquerda em formulários.
- Limite de valor com mensagem ("Máximo R$ 50.000,00 por transação").
