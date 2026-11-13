---
id: async-button-states
title: Botão com estado assíncrono
category: feedback
summary: Botão que mostra carregando, sucesso e erro no próprio lugar, sem mudar de largura, sem duplo envio e com o resultado anunciado para leitor de tela. O rótulo muda de verbo ("Salvar" → "Salvando…" → "Salvo").
themes: [clean-saas, aurora, editorial, brutalista, playful]
products: [saas, erp, crm, admin, ecommerce, fintech, landing, ai-app, automation, helpdesk, b2b, booking, delivery, pos, subscription]
motion: low
tech: css-js
deps: []
a11y: aria-disabled (não disabled) durante o envio para manter o foco; região role="status" anuncia "Salvando", "Salvo" e o erro; erro também aparece em texto ao lado, não só na cor do botão.
perf: Rótulos empilhados no mesmo grid-area, então a largura é a do maior estado e nada se move; spinner em CSS (transform), sem imagem.
reference_name: Material 3 (Buttons, loading) e Apple HIG (Feedback)
reference_url: https://m3.material.io/components/buttons/guidelines
react: Button do @webcode com prop loading e useTransition/useActionState (React 19) ou mutation.isPending do TanStack Query.
status: stable
---

## Quando usar
- Ações que esperam o servidor por mais de ~300ms: salvar, enviar, pagar, gerar.

## Evite
- Spinner sem texto: o usuário não sabe se travou.
- `disabled` durante o envio: o foco salta para o body e o leitor de tela perde o contexto.
- Sucesso que fica para sempre: volte ao estado normal em ~2s, ou troque para a próxima ação.

## Implementação
- Spinner só aparece após 150–300ms (evita piscar em respostas rápidas).
- Bloqueie duplo clique com o estado, não com timeout.
- Erro: botão volta a ser clicável com "Tentar de novo" e a mensagem do erro ao lado.
