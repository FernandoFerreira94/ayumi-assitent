---
id: otp-code-input
title: Código de verificação (OTP) que aceita colar
category: form
summary: Um único input com aparência de 6 caixas, preenchimento automático do SMS (one-time-code), colar o código inteiro, envio automático no último dígito e reenviar com contagem.
themes: [aurora, clean-saas, editorial, playful]
products: [fintech, saas, ecommerce, mobile-app, health, ai-app, marketplace, subscription, delivery]
motion: low
tech: css-js
deps: []
a11y: É um input real com label, autocomplete="one-time-code" e inputmode="numeric"; as caixas são decorativas (aria-hidden); erro e reenvio anunciados em role="status"; nada de 6 inputs separados que quebram colar e leitores de tela (WCAG 3.3.8).
perf: Só CSS para desenhar as caixas a partir do valor; contagem com um setInterval que para no zero.
reference_name: web.dev (SMS OTP form best practices)
reference_url: https://web.dev/articles/sms-otp-form
react: Use o InputOTP do shadcn (input-otp) configurado com autoComplete="one-time-code" e pattern numérico, ou este padrão para zero dependência.
status: stable
---

## Quando usar
- Login sem senha, confirmação de telefone/e-mail, autorização de transação.

## Evite
- 6 inputs separados com foco pulando (colar falha, apagar é confuso).
- Bloquear colar.
- Reenviar sem limite ou sem contagem visível.

## Implementação
- Input transparente sobre 6 caixas desenhadas; a caixa atual mostra o cursor.
- No 6º dígito envia sozinho e mostra carregando; erro limpa o campo e mantém o foco.
- "Reenviar código" liberado após 30s, com o canal (SMS/WhatsApp/e-mail) e o destino mascarado.
