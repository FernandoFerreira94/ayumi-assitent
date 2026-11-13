---
id: onboarding-pages
title: Onboarding em páginas deslizáveis
category: onboarding
summary: Até 3 telas de boas-vindas que deslizam com o dedo (scroll-snap nativo), com indicador de página, "Pular" sempre à vista e um botão que vira "Começar" na última. Cada tela vende um benefício, não uma função.
themes: [aurora, playful, clean-saas]
products: [mobile-app, habits, fintech, health, delivery, edtech, ai-app]
motion: medium
tech: css-js
deps: []
a11y: Região com aria-roledescription="carrossel" e cada página como grupo "1 de 3"; botões Próximo/Pular reais (o deslize é opcional); pontos são botões com aria-current; páginas fora da tela ficam inert; reduced motion troca a rolagem suave por salto.
perf: Deslize é scroll nativo com scroll-snap (60fps, inércia do sistema, sem JS de gesto). IntersectionObserver atualiza o indicador; ilustrações em CSS.
reference_name: Apple HIG (Onboarding) e NN/g (Mobile app onboarding)
reference_url: https://developer.apple.com/design/human-interface-guidelines/onboarding
react: Componente Carousel @webcode (ADR 0008) em modo páginas, ou CSS scroll-snap direto. Expo: FlatList horizontal com pagingEnabled ou react-native-pager-view. Grave "onboarding visto" e nunca mostre de novo após atualizar o app.
status: stable
---

## Quando usar
- Primeira abertura de apps em que o valor não é óbvio (hábitos, finanças, saúde) e há 1–3 ideias que mudam como a pessoa usa.

## Evite
- Mais de 3 páginas, ou páginas explicando a interface (ensine no contexto, padrão `product-tour`).
- Pedir permissões aqui. Peça no momento do uso (padrão `permission-priming`).
- Esconder o "Pular" ou obrigar cadastro antes de mostrar o app.

## Implementação
- `scroll-snap-type: x mandatory` + `scroll-snap-stop: always` nas páginas.
- Botão principal no terço inferior (alcance do polegar); "Pular" no topo à direita.
- A última página termina numa ação útil ("Criar meu primeiro hábito"), não em "Concluir".
