---
id: paywall-plans
title: Paywall de planos no celular (teste grátis, anual em destaque)
category: commerce
summary: Tela de assinatura para app/PWA: fechar sempre visível, 3 benefícios, escolha entre mensal e anual (anual com economia e preço por mês), linha do tempo do teste grátis ("hoje, dia 5 lembrete, dia 7 cobrança"), botão fixo no rodapé com o preço exato e "Restaurar compra".
themes: [aurora, clean-saas, playful, cinematografico]
products: [subscription, mobile-app, saas, edtech, health, habits, ai-app]
motion: low
tech: css-js
deps: []
a11y: Planos são radiogroup nativo com o preço inteiro no rótulo (não só "R$ 14,99/mês"). Fechar é um botão com rótulo, primeiro no Tab. O botão principal repete plano e valor ("Começar teste grátis, depois R$ 179,90 por ano"). Contraste de texto sobre o destaque conferido pelos tokens.
perf: Sem libs e sem imagem pesada (ícones SVG). O rodapé fixo usa env(safe-area-inset-bottom). Nada é carregado antes de a pessoa tocar em assinar.
reference_name: Apple HIG (In-app purchase) e paywalls da RevenueCat
reference_url: https://developer.apple.com/design/human-interface-guidelines/in-app-purchase
react: O preço vem da loja (StoreKit/Play Billing ou Stripe) já formatado em pt-BR; nunca fixe o valor no código. Mantenha o plano escolhido em estado e mande o id do produto no checkout.
status: beta
---

## Quando usar
- Fim do onboarding ou toque num recurso pago, com teste grátis ou plano anual.

## Evite
- Esconder o X ou atrasar o fechar (dark pattern, e a Apple rejeita).
- Mostrar só o preço por mês do anual sem o total cobrado.
- Teste grátis sem dizer quando cobra e como cancelar.
- Pré-selecionar um plano que a pessoa não pediu sem destacar o motivo (o anual vem marcado e diz "Economize 25%").

## Implementação
- Layout em coluna com `min-height: 100dvh`; o rodapé é `position: sticky; bottom: 0` com fundo sólido e `padding-bottom: max(16px, env(safe-area-inset-bottom))`.
- O texto do botão e o resumo abaixo dele mudam com o plano.
- Valores com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
