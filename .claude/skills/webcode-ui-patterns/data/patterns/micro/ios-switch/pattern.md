---
id: ios-switch
title: Switch estilo iOS
category: micro
summary: Interruptor com o knob que estica enquanto você pressiona e desliza com mola ao soltar. Detalhe direto do iOS, acessível de verdade.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [saas, mobile-app, fintech, admin, erp, health, ai-app, automation, crm, habits, subscription]
motion: low
tech: css-js
deps: []
a11y: button role="switch" com aria-checked e rótulo associado. Espaço e Enter alternam. Estado também visível pela posição, não só cor.
perf: transform e width do knob (elemento pequeno). Mola via token.
reference_name: Apple HIG (Toggles)
reference_url: https://developer.apple.com/design/human-interface-guidelines/toggles
react: Use o Switch do shadcn (Radix/Base UI) e aplique estas classes; o comportamento acessível já vem pronto.
status: stable
---

## Quando usar
- Preferências que valem imediatamente (sem botão Salvar).

## Evite
- Switch em formulário que só é aplicado ao enviar: use checkbox.

## Implementação
- Knob de 24px que vai a 30px no `:active` (o "esticar" do iOS) e compensa o lado com `translateX`.
- Trilho muda de `--wc-control-border` para `--wc-success` (ou accent) ao ligar.
