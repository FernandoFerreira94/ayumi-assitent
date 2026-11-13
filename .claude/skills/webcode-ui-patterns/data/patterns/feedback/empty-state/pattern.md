---
id: empty-state
title: Estados vazio, sem resultado e erro
category: feedback
summary: Três variações do mesmo bloco: primeira vez (ensina e convida), busca sem resultado (oferece saída) e erro (explica e deixa tentar de novo).
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [saas, erp, crm, admin, helpdesk, ecommerce, mobile-app, devtools, ai-app, automation, b2b, delivery, editorial, edtech, field-service, habits, health, institutional, logistics, marketplace, pos, realestate]
motion: none
tech: css
deps: []
a11y: Título real (h2/h3), ilustração aria-hidden, ação principal como botão nativo. Erro usa role=alert apenas quando aparece após uma ação.
perf: Ilustração em SVG inline com tokens (sem imagem externa).
reference_name: NN/g (empty states)
reference_url: https://www.nngroup.com/articles/empty-state-interface-design/
react: Componente <EmptyState variant icon title action>.
status: stable
---

## Quando usar
- Toda lista, tabela ou painel que pode ficar vazio. Projete o vazio junto com o cheio.

## Evite
- "Nenhum dado encontrado" sem próximo passo. Ilustração gigante que empurra a ação para fora da tela.

## Implementação
- Estrutura fixa: ilustração (64–96px), título curto, uma frase, ação primária, ação secundária opcional.
- Copy por variação: primeira vez fala do benefício; sem resultado fala da busca; erro diz o que houve e o que fazer.
