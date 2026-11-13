---
id: ai-prompt-composer
title: Campo de prompt com exemplos e anexos
category: ai
summary: Caixa de prompt que cresce com o texto, mostra exemplos clicáveis no estado vazio, anexos como chips removíveis, o escopo de dados em uso e envia com Enter (Shift+Enter quebra linha). No mobile, botão de enviar explícito.
themes: [aurora, clean-saas, playful]
products: [ai-app, saas, crm, helpdesk, automation, devtools, edtech]
motion: low
tech: css-js
deps: []
a11y: textarea com label; exemplos são botões; cada chip tem botão "Remover anexo X"; botão Enviar com aria-disabled quando vazio; contador e atalho descritos em aria-describedby.
perf: Auto-altura com field-sizing:content e fallback em JS (scrollHeight) limitado a ~8 linhas; nada re-renderiza fora do campo enquanto digita.
reference_name: Google PAIR (People + AI Guidebook) e shape of AI
reference_url: https://www.shapeof.ai/
react: Textarea do @webcode com field-sizing; anexos em estado local; envio via useChat (AI SDK) ou fetch com ReadableStream.
status: stable
---

## Quando usar
- Toda entrada livre para IA: chat, "pergunte aos seus dados", gerar texto, automação por linguagem natural.

## Evite
- Caixa em branco sem exemplos: o usuário não sabe o que a IA sabe fazer.
- Enter enviando no mobile (lá o Enter quebra linha; envie pelo botão).
- Esconder o que vai junto com o prompt (arquivos, dados, contexto).

## Implementação
- Exemplos tirados do domínio do produto ("Resuma as vendas de outubro"), 3 a 4, somem ao digitar.
- Escopo visível acima do campo ("Usando: Pedidos de outubro, 312 registros") com opção de trocar.
- Respeite IME: não envie com Enter enquanto `isComposing`.
