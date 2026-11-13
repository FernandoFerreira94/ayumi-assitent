---
id: swipe-row-actions
title: Ações por swipe na linha (com alternativa)
category: gesture
summary: Arrastar a linha para a esquerda revela Arquivar e Excluir, arrastar até o fim executa a ação principal, e o mesmo conjunto de ações existe num botão "⋯" e no teclado. O gesto acelera, nunca é o único caminho.
themes: [aurora, clean-saas, playful]
products: [mobile-app, helpdesk, crm, delivery, logistics, health, ai-app, field-service]
motion: medium
tech: js
deps: []
a11y: Botão "Mais ações para X" em cada linha (WCAG 2.5.1 e 2.5.7: gesto de arrasto sempre com alternativa de um toque); ações reveladas são botões reais; Delete no teclado com foco na linha; resultado anunciado e com desfazer.
perf: Pointer Events com setPointerCapture e touch-action: pan-y (rolagem vertical continua nativa); só translate durante o arrasto; snap final com spring CSS.
reference_name: Apple HIG (Gestures) e WCAG 2.2 (2.5.7 Dragging Movements)
reference_url: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
react: Card de lista com bordinhas pronto em @webcode/card-acao-lateral (ação à esquerda, informação à direita, desfazer, preset Colinas OS); linha simples com pointer events próprios e menu "⋯" com DropdownMenu do @webcode.
status: stable
---

## Quando usar
- Listas mobile com uma ou duas ações muito frequentes: arquivar mensagem, concluir tarefa, remover item.

## Evite
- Ação destrutiva irreversível no swipe completo: use desfazer ou peça confirmação.
- Mais de 3 ações reveladas.
- Gesto sem pista visual: o "⋯" e a primeira utilização ensinam que dá para arrastar.

## Implementação
- Limiar de abertura ~30% da largura da ação; swipe completo a partir de ~60% da linha, com vibração (`navigator.vibrate`, se disponível) ao cruzar.
- Só uma linha aberta por vez; tocar fora fecha.
- Diferencie arrasto horizontal de rolagem pelos primeiros 8px de movimento.

## Variante: card com bordinhas (`@webcode/card-acao-lateral`)
- Bordinha direita (texto vertical + borda na cor do status de destino) é a próxima ação; puxar para a esquerda: até 30% só revela, 30–50% abre os botões, acima de 50% executa com "Feito · Desfazer" por 5s.
- Bordinha esquerda é informação (equipamentos ou "Detalhes"); puxar para a direita abre um painel dentro do card que só rola por dentro enquanto aberto.
- Tocar na bordinha faz o mesmo que o gesto; sem ação para o usuário, a bordinha fica cinza e não arrasta. As ações por cargo/status chegam prontas por props.
