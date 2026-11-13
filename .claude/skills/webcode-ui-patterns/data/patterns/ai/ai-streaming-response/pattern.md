---
id: ai-streaming-response
title: Resposta em streaming com parar e regenerar
category: ai
summary: Resposta da IA que chega aos poucos com primeiro sinal em menos de 1s ("Lendo 312 pedidos…"), botão Parar sempre visível, rolagem que só acompanha se o usuário estiver no fim, e ao terminar ações de copiar, regenerar e avaliar, com fontes clicáveis.
themes: [aurora, clean-saas]
products: [ai-app, saas, helpdesk, crm, devtools, edtech, automation]
motion: low
tech: css-js
deps: []
a11y: Área da resposta com aria-busy durante a geração; anúncio único em role="status" no início e no fim ("Resposta pronta"), nunca token a token; Parar com foco preservado; ações com rótulo.
perf: Texto acrescentado em lotes por requestAnimationFrame (não um reflow por token); cursor de streaming em CSS; largura de leitura limitada a ~70ch.
reference_name: Microsoft (Guidelines for Human-AI Interaction)
reference_url: https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/
react: useChat do AI SDK (status, stop, regenerate) ou fetch + ReadableStream; markdown renderizado incrementalmente com memo por bloco.
status: stable
---

## Quando usar
- Qualquer resposta gerada que leva mais de 1s: chat, resumo, rascunho, explicação de dados.

## Evite
- Efeito de digitação artificial lento: mostre o texto na velocidade que chega.
- Rolar a página para o fim enquanto o usuário está lendo mais acima.
- Leitor de tela anunciando cada palavra (use o anúncio de início e fim).

## Implementação
- Estados: pensando (etapa real) → escrevendo (cursor) → pronto (ações) · parado ("Resposta interrompida") · erro (tentar de novo).
- "Ir para o fim" aparece quando o usuário rola para cima durante o streaming.
- Fontes como chips numerados ligados às citações no texto.
