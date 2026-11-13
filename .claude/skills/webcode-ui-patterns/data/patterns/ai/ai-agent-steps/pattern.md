---
id: ai-agent-steps
title: Linha do tempo de passos do agente
category: ai
summary: Cada ação que o agente executa aparece como um passo legível (o que fez, em quê, resultado), com estado em andamento, concluído ou com erro, duração, detalhe recolhível e "Tentar de novo" ou "Fazer manualmente" no erro. Recolhe em um resumo quando termina.
themes: [aurora, clean-saas]
products: [ai-app, automation, devtools, saas, helpdesk, crm]
motion: low
tech: css-js
deps: []
a11y: Lista ordenada; estado de cada passo em texto ("concluído", "falhou"), não só ícone; detalhes em <details>; progresso anunciado em role="status" a cada passo, não a cada mudança de texto.
perf: Passos acrescentados no fim da lista (sem re-render da lista toda); spinner em CSS; resumo final via <details> nativo.
reference_name: Google PAIR (Explainability + Trust)
reference_url: https://pair.withgoogle.com/chapter/explainability-trust/
react: Componente AgentSteps a partir dos tool calls (AI SDK message.parts com type "tool-*"), status por estado da chamada.
status: stable
---

## Quando usar
- Agentes que chamam ferramentas, buscam dados ou executam várias etapas antes de responder.

## Evite
- Mostrar JSON cru como passo principal (vai para o detalhe).
- Esconder erros de ferramenta atrás de "Algo deu errado".
- Lista que cresce sem fim: recolha em "6 passos · 12s" ao terminar.

## Implementação
- Verbo no passado para concluído ("Li 3 planilhas"), gerúndio em andamento ("Buscando clientes…").
- Erro explica em linguagem humana e oferece caminho: tentar de novo, pular, fazer manualmente.
