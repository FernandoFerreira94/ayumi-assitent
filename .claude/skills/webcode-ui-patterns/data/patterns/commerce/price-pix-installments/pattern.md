---
id: price-pix-installments
title: Preço com Pix e parcelamento
category: commerce
summary: Bloco de preço brasileiro com hierarquia clara: preço à vista no Pix em destaque, desconto em % e em reais, preço no cartão e parcelas sem juros, "de" riscado acessível e seletor de parcelas que mostra o total com juros quando houver.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [ecommerce, marketplace, subscription, b2b, delivery, booking, fintech]
motion: none
tech: css-js
deps: []
a11y: Preço antigo com texto oculto "Preço anterior:" (o risco some no leitor de tela); valores formatados com Intl e lidos por extenso; parcelas em <select> nativo com rótulo; nunca só cor para indicar desconto.
perf: Tudo calculado no cliente com Intl.NumberFormat em cache; números com tabular-nums para não pular ao trocar parcela.
reference_name: Baymard Institute (Product page pricing) e Banco Central (Pix)
reference_url: https://baymard.com/blog/product-page-pricing
react: Componente PriceTag (compostos BR do @webcode) com price, pixDiscount, installments e interest; formatação centralizada num util brl().
status: stable
---

## Quando usar
- Página de produto, card de vitrine (versão compacta), carrinho e checkout no Brasil.

## Evite
- Mostrar só a parcela ("12x de R$ 29") escondendo o total: gera desconfiança e reclamação.
- Três preços com o mesmo peso visual.
- "Sem juros" quando há juros a partir de certa parcela: diga a partir de quando.

## Implementação
- Ordem: Pix (destaque) → cartão (à vista ou parcelado) → "de" riscado, quando houver.
- Arredonde parcelas para baixo no centavo e jogue a diferença na primeira (como fazem os adquirentes).
- Parcela mínima (ex.: R$ 10) limita o número de parcelas.
