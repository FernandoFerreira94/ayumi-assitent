---
id: product-tour
title: Tour guiado de primeiro acesso (spotlight)
category: onboarding
summary: No primeiro login, um tour curto recorta cada área importante com o scrim do tema e explica em um cartão ancorado; abre sozinho uma vez, pode ser pulado e reaberto pelo menu de ajuda.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, erp, crm, admin, helpdesk, fintech, edtech, ai-app, automation, logistics, devtools, health, pos, marketplace]
motion: medium
tech: css-js
deps: []
a11y: Cartão com role=dialog e aria-modal, título e descrição ligados por aria-labelledby/aria-describedby; foco entra no botão principal, Tab fica no cartão e o foco volta para onde estava ao fechar; Esc pula, setas navegam; troca de passo anunciada por aria-live e progresso em texto ("2 de 5"), não só em pontos; Pular sempre visível.
perf: Um único elemento de recorte (box-shadow com o scrim) sem SVG nem canvas; mede o alvo com getBoundingClientRect em requestAnimationFrame só durante rolagem/resize; nada roda com o tour fechado. Deslizamento entre passos só na troca, com movimento reduzido vira troca seca.
reference_name: Linear, Notion e Stripe Dashboard (tours curtos de primeiro acesso); NN/g sobre onboarding
reference_url: https://www.nngroup.com/articles/onboarding-tutorials/
react: Use @webcode/tour (TourProvider + TourTrigger + useTour). Passe `id` e `version`, `userId` para separar contas no mesmo navegador e `storage` com { get, set } da sua API quando o "já visto" tiver de seguir o usuário entre aparelhos. `variant="floating"` para não bloquear a página; `enabled` liga/desliga no projeto.
status: beta
---

## Quando usar
- Produto com áreas que o usuário não descobre sozinho no primeiro dia (sidebar densa, ações escondidas em menus, atalhos).
- Mudança grande de interface: suba a `version` e mostre só o que mudou (2–3 passos).
- Como complemento de um checklist de ativação: o tour mostra **onde**, o checklist leva a **fazer**.

## Evite
- Mais de 5 passos. Se precisar de mais, o problema é a interface ou o tour deve virar vários tours contextuais.
- Explicar o óbvio ("Este é o botão Salvar"). Cada passo responde "por que isso me ajuda agora".
- Abrir antes da página carregar, por cima de um modal, ou a cada login. Abre uma vez, depois só pelo menu de ajuda.
- Tour em landing page, checkout ou fluxo de conversão: atrapalha a tarefa principal.
- Bloquear sem saída: Pular e Esc sempre funcionam e contam como "já visto".

## Implementação
- **Opção do projeto**: `enabled` liga/desliga o recurso; `variant` escolhe o estilo: `spotlight` (escurece e prende o foco, para o primeiro acesso) ou `floating` (cartão sem bloquear, para novidades).
- **Primeiro acesso**: chave `wc-tour:<id>:v<versão>:<usuário>` com `completed` ou `skipped`. localStorage por padrão; com backend, grave no perfil (ex.: `PATCH /me { tours: { onboarding: { v: 2, status } } }`) para não repetir em outro aparelho.
- **Passos**: 3–5, primeiro sem alvo (boas-vindas centralizada dizendo quanto tempo leva), último aponta para onde reabrir o tour. Alvos por `data-tour="..."`, não por classe de estilo.
- **Recorte**: um elemento `position: fixed` no retângulo do alvo + folga, com `box-shadow: 0 0 0 100vmax var(--wc-scrim)` e contorno de foco; desliza entre passos em `slow` com `ease-out`.
- **Cartão**: lado preferido, vira quando não cabe e fica a 12px das bordas; alvo fora da tela é rolado para o centro antes. No mobile, cartão preso embaixo (ou em cima, se o alvo estiver embaixo), com safe-area.
- **Alvo ausente** (feature desligada, permissão): o passo aparece centralizado em vez de quebrar.
- **Medição**: ative o tour para uma amostra e meça conclusão, onde pulam e ativação em 7 dias com e sem tour.
