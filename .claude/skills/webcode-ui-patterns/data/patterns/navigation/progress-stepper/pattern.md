---
id: progress-stepper
title: Stepper de etapas (checkout e onboarding)
category: navigation
summary: Indicador de etapas com estado concluído, atual e futuro, que deixa voltar a etapas já feitas, mostra "Etapa 2 de 4" em texto e vira barra compacta no mobile. Para fluxos lineares de 3 a 5 etapas.
themes: [clean-saas, aurora, editorial, playful]
products: [ecommerce, subscription, saas, fintech, health, booking, delivery, edtech, b2b, field-service]
motion: low
tech: css-js
deps: []
a11y: Lista ordenada com aria-current="step" na etapa atual; etapas concluídas são botões ("Voltar para Entrega, concluída"); etapas futuras não são focáveis; título da etapa recebe foco ao avançar.
perf: Só CSS para estados; a linha de progresso anima scale (transform), não width.
reference_name: Baymard Institute (Checkout progress indicators)
reference_url: https://baymard.com/blog/checkout-process-steps
react: "`npx shadcn add @webcode/stepper @webcode/form-validation`: Stepper + validate(etapa) do useFormValidation; foque o título da etapa ao avançar."
status: stable
---

## Quando usar
- Checkout, cadastro, onboarding, solicitação com etapas lineares e curtas.

## Evite
- Mais de 5 etapas: agrupe ou divida o fluxo.
- Stepper clicável para frente sem validar a etapa atual.
- Esconder o total: "Etapa 2 de 4" reduz abandono.

## Implementação
- Rótulos curtos e concretos ("Entrega", "Pagamento"), não "Passo 2".
- No mobile, só a etapa atual por extenso e uma barra de progresso.
- Botão Voltar preserva o que foi digitado.
