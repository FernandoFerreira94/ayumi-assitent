---
id: mini-cart-drawer
title: Mini carrinho em sheet lateral
category: commerce
summary: Ao adicionar, o botão confirma no lugar, o contador do carrinho pulsa uma vez e um sheet lateral (bottom sheet no mobile) mostra itens com quantidade, barra de frete grátis, subtotal com Pix e o botão de finalizar. Remover tem desfazer.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [ecommerce, marketplace, delivery, subscription, b2b]
motion: medium
tech: css-js
deps: []
a11y: Sheet em <dialog> modal com título "Carrinho (3 itens)"; contador do ícone com rótulo completo ("Carrinho, 3 itens"); stepper de quantidade com botões rotulados e valor em role="status"; foco volta ao botão que abriu.
perf: <dialog> nativo com @starting-style e allow-discrete; totais recalculados só no que muda; a barra de frete anima transform (scaleX).
reference_name: Baymard Institute (Cart and checkout usability)
reference_url: https://baymard.com/research/checkout-usability
react: Sheet do @webcode (side="right", vira bottom no mobile) + estado do carrinho em store (Zustand ou contexto) com otimismo.
status: stable
---

## Quando usar
- Lojas em que o cliente adiciona vários itens antes de pagar e quer conferir sem sair da página.

## Evite
- Abrir o sheet automaticamente a cada item em lojas de compra múltipla (prefira confirmar no botão; abra só no primeiro).
- Esconder frete e prazo até o checkout.
- Remover sem desfazer.

## Implementação
- Barra "Faltam R$ 41,10 para frete grátis" incentiva sem empurrar.
- Quantidade mínima 1; abaixo disso, o botão vira "Remover".
- Subtotal com o preço Pix e no cartão (ver `price-pix-installments`).
