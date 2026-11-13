---
id: toast-stack
title: Toasts empilhados que expandem no hover
category: feedback
summary: Notificações empilham como cartas (só a da frente inteira), expandem ao passar o mouse e somem sozinhas, pausando enquanto o usuário interage.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [saas, erp, crm, admin, ecommerce, devtools, helpdesk, ai-app, automation, b2b, booking, delivery, edtech, field-service, fintech, habits, health, institutional, logistics, marketplace, mobile-app, pos, subscription]
motion: medium
tech: css-js
deps: []
a11y: Região role=status com aria-live polite (erros usam role=alert). Timer pausa no hover e no foco. Toast com ação não some sozinho.
perf: Posições calculadas uma vez por mudança e aplicadas via transform. Máximo de 3 visíveis.
reference_name: Sonner (Emil Kowalski)
reference_url: https://sonner.emilkowal.ski
react: Use Sonner (já é o toast do shadcn) com o tema WebCode; este demo mostra o comportamento e os tokens.
status: stable
---

## Quando usar
- Confirmação de ações assíncronas e eventos em background ("Exportação pronta").

## Evite
- Erro de formulário em toast: o erro vai ao lado do campo.
- Mais de 3 toasts visíveis ou texto acima de 2 linhas.

## Implementação
- Cada toast recebe `--i` (0 = mais novo). Recolhido: `translateY(i * 10px) scale(1 - i * .05)`. Expandido: `translateY(i * (altura + gap))`.
- Duração de 4s; pausa com `pointerenter` e `focusin`.
