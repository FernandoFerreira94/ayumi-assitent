---
id: form-error-summary
title: Validação no blur com resumo de erros
category: form
summary: Campos validam ao sair (e reavaliam enquanto o usuário corrige), e o envio com erros mostra um resumo no topo com links que levam a cada campo. Padrão GOV.UK adaptado.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, ecommerce, health, fintech, edtech, institutional, b2b, subscription]
motion: low
tech: css-js
deps: []
a11y: novalidate com mensagens próprias em texto; aria-invalid e aria-describedby por campo; resumo com role="alert" recebe o foco no envio; links do resumo focam o campo; erro nunca só por cor (ícone + texto).
perf: Validação síncrona leve; nenhuma biblioteca; nenhum layout shift (espaço da mensagem só aparece no erro, abaixo do campo).
reference_name: GOV.UK Design System (Error summary e Validation)
reference_url: https://design-system.service.gov.uk/components/error-summary/
react: "`npx shadcn add @webcode/form-validation`: useFormValidation (blur + correção, mensagens pt-BR) e FormErrorSummary, sem react-hook-form."
status: stable
---

## Quando usar
- Formulários com 4 ou mais campos, cadastros, checkout, configurações.

## Evite
- Validar a cada tecla antes do primeiro blur.
- Botão de envio desabilitado até tudo estar válido (esconde o motivo).
- Toast como único aviso de erro de formulário.

## Implementação
- Regras por campo com mensagem específica e solução.
- No envio inválido: resumo aparece no topo, recebe foco e lista os erros na ordem dos campos; cada item é um link `#campo`.
- Com 1 ou 2 campos, dispense o resumo e foque o primeiro inválido.
