---
id: pricing-tiers
title: Planos e preços com mensal/anual
category: section
summary: Três planos lado a lado com alternância mensal/anual, plano recomendado em destaque, preço em R$ com economia explícita e o que muda de um plano para o outro.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [landing, saas, subscription, ai-app, devtools, automation, edtech, launch]
motion: low
tech: css-js
deps: []
a11y: Alternância é um grupo de botões com aria-pressed; o novo preço é anunciado uma vez por região aria-live polite. Cada plano é um article com h3; a lista de recursos usa ✓ decorativo com aria-hidden e texto real. O destaque não depende só de cor (selo "Mais escolhido" em texto).
perf: Só troca de texto e uma classe; números com tabular-nums para não pular a largura. Nenhuma imagem.
reference_name: Stripe Billing (tabela de preços) e NN/g (pricing pages)
reference_url: https://docs.stripe.com/payments/checkout/pricing-table
react: Server component para a grade; o seletor de ciclo vira client component com useState e Intl.NumberFormat('pt-BR'). Preços vêm do back-end (nunca calculados no cliente para cobrança).
status: stable
---

## Quando usar
- Página de preços de SaaS, assinatura ou app com 2 a 4 planos.
- Quando o desconto anual é argumento de venda e precisa aparecer como valor em reais, não só em porcentagem.

## Evite
- Mais de 4 planos lado a lado: use a tabela de comparação (`plan-comparison-table`) abaixo dos cards.
- Esconder o preço do plano empresarial e do gratuito atrás de "fale conosco" sem dar uma faixa.
- Mudar a ordem dos planos entre mensal e anual.

## Implementação
- Grade `repeat(auto-fit, minmax(260px, 1fr))`; no mobile os cards empilham e o recomendado vem primeiro só visualmente com `order` quando fizer sentido para o negócio (a ordem do DOM continua do menor para o maior).
- Preço anual mostrado como valor mensal equivalente + total por ano + economia em R$ ("economize R$ 238 por ano").
- Cada card repete o que o anterior tem ("Tudo do Essencial, mais:") para a lista ficar curta.
- Brasil: mencione Pix/boleto no anual e se o valor inclui impostos; NF-e emitida automaticamente é argumento para B2B.
