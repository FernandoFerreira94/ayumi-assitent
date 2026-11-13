---
id: auth-animated-tabs
title: Entrar | Criar conta em abas segmentadas (com link mágico)
category: auth
summary: Controle segmentado estilo iOS alterna entre entrar e criar conta; o indicador desliza, o conteúdo cruza com fade e a altura do cartão se ajusta suavemente. Na aba Entrar dá para trocar senha por link mágico enviado por e-mail.
themes: [clean-saas, aurora, editorial, brutalista, playful]
products: [saas, ai-app, ecommerce, subscription, health, booking, delivery, mobile-app]
motion: medium
tech: css-js
deps: []
a11y: Padrão Tabs da APG (tablist, tab com aria-selected, tabpanel com aria-labelledby); setas, Home e End movem entre abas com ativação automática. Painel inativo hidden. A troca senha ↔ link mágico é um botão com aria-controls que anuncia o novo modo.
perf: Altura anima de uma medida para outra só durante a troca (depois volta a auto). Indicador com translate. Nenhum layout por frame.
reference_name: Segmented Control do iOS e login do Notion (link mágico)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
react: Tabs do shadcn (Radix) com o indicador posicionado por data-state; altura com ResizeObserver ou interpolate-size quando suportado.
status: stable
---

## Quando usar
- Cartão de acesso em modal ou página curta, onde login e cadastro dividem o mesmo espaço.
- Produtos que querem oferecer link mágico sem esconder a senha.

## Evite
- Abas para fluxos sequenciais (cadastro em etapas): use `signup-multi-step`.
- Mudar a altura do cartão sem transição: o conteúdo abaixo pula.

## Implementação
- Indicador absoluto com `width: calc(50% - 4px)` e `translate: calc(var(--i) * 100%)` em mola rápida.
- Altura: fixe a altura atual, troque o painel, meça a nova e anime; ao terminar, `height: auto`.
- Painel novo entra com opacity e 6px de deslocamento (× `--wc-motion-distance`).
- Link mágico: depois do envio, mostra o e-mail usado, o atalho "Abrir Gmail/Outlook" e reenvio com contagem.
