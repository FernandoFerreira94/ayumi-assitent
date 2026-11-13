---
id: mobile-checkout-steps
title: Checkout mobile em etapas
category: commerce
summary: Entrega, pagamento e revisão em telas curtas, com progresso no topo, total e botão grudados no rodapé e transição na direção do avanço. Voltar mantém tudo preenchido e a revisão deixa editar cada bloco direto.
themes: [aurora, clean-saas, playful]
products: [ecommerce, delivery, mobile-app, subscription, marketplace, booking, fintech]
motion: medium
tech: js
deps: []
a11y: Progresso em texto ("Etapa 2 de 3: Pagamento") e aria-current no passo; foco vai ao título da etapa a cada troca; grupos de rádio com fieldset/legend; total anunciado em aria-live ao mudar o frete; botão sempre visível.
perf: Etapas no mesmo documento (sem recarregar), só translate + opacity na troca. Estado num objeto único, pronto para persistir em sessionStorage.
reference_name: Baymard Institute (Checkout usability) e Apple HIG (Apple Pay)
reference_url: https://baymard.com/research/checkout-usability
react: Estado do checkout em useReducer (ou Zustand) com a etapa na URL (?etapa=pagamento) para o voltar do sistema funcionar. Componentes @webcode RadioGroup, Field e PriceTag (Pix e parcelas).
status: stable
---

## Quando usar
- Checkout de app ou PWA com 2–4 decisões: endereço/frete, pagamento, revisão.
- Fluxos de contratação e agendamento com o mesmo formato (dados, plano, confirmação).

## Evite
- Pedir cadastro antes de pagar: ofereça compra como convidado e crie a conta depois.
- Mais de 4 etapas. Junte o que for curto.
- Esconder o total até a última etapa.
- Esconder o botão de continuar fora da tela no celular.

## Implementação
- Barra fixa no rodapé com total + CTA, `env(safe-area-inset-bottom)` e acima do teclado (padrão `mobile-keyboard-form`).
- Pix em primeiro quando for o meio mais usado; mostre desconto no próprio rádio.
- Revisão com "Alterar" por bloco que leva à etapa e volta direto para a revisão.
- Botão final com o valor ("Pagar R$ 189,80") e estado de carregamento (padrão `async-button-states`).
