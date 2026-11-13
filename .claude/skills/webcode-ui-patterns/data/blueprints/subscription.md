---
id: subscription
title: Assinatura e D2C
family: Commerce
summary: Marca que vende direto ao consumidor por assinatura (café, cosmético, pet, SaaS consumer). Valor claro, plano fácil de escolher, cancelar tão fácil quanto assinar.
kpi: Conversão em assinante e churn mensal
themes: [aurora, editorial, brutalista]
patterns: [glass-sticky-header, product-shot-hero, bento-grid, scroll-reveal-stagger, ios-switch, press-spring-button, bottom-sheet, toast-stack, confirm-alert-dialog, cep-address-autofill, form-error-summary, progress-stepper, async-button-states, status-banner, price-pix-installments, pix-copy-paste, segmented-control, conversion-funnel, apple-expand-menu, auth-sliding-panels, auth-flip-card, auth-animated-tabs, password-recovery-flow, footer-newsletter, footer-ecommerce-br, pricing-tiers, plan-comparison-table, testimonial-wall, faq-accordion, order-tracking]
density: spacious
radius: 14
components: [button, card, toggle-group, radio-group, accordion, dialog, alert-dialog, sheet, drawer, field, input, badge, sonner, tabs]
status: stable
---

## Objetivo
Fazer a pessoa entender o que recebe, quanto paga e com que frequência, e depois deixá-la no controle da assinatura sem precisar de atendimento.

## Mapa
| Página | Conteúdo | Padrões |
| --- | --- | --- |
| Home | promessa, como funciona em 3 passos, prova social, planos | product-shot-hero, bento-grid |
| Planos | 2–3 planos, alternância mensal/anual com economia em R$, o recomendado destacado | ios-switch |
| Montar assinatura | quiz curto ou escolha de itens, frequência, prévia da primeira caixa | press-spring-button |
| Checkout | endereço por CEP, cartão recorrente ou Pix automático, resumo com data da próxima cobrança | — |
| Minha assinatura | próxima entrega, pular, trocar itens, mudar frequência, pausar, cancelar | bottom-sheet, confirm-alert-dialog, toast-stack |

## Regras
- Preço por ciclo e por unidade ("R$ 89/mês · R$ 2,96 por dose"), total anual quando houver desconto.
- Data da próxima cobrança visível no checkout e na conta.
- Pausar e pular oferecidos antes de cancelar, mas cancelar a 2 cliques, sem ligação (Código de Defesa do Consumidor e decreto do SAC).
- Lembrete antes da renovação anual.
- Cobrança falhou: aviso no app e e-mail com atualizar cartão em um passo.

## Recomendações
- **Tema:** Aurora (produto tech/consumer) ou Editorial (marcas artesanais, cosmético premium).
- **Densidade:** espaçosa no site, confortável na área do assinante.
- **Componentes-chave:** ToggleGroup mensal/anual, Card de plano, Accordion de FAQ, AlertDialog no cancelamento, Drawer no mobile.

## Estados críticos
- Assinatura pausada: quando volta e como retomar já.
- Item sem estoque na próxima caixa: substituto sugerido com aceite.
- Cancelamento: confirma até quando o acesso/entrega continua.

## Anti-padrões
- Esconder o cancelamento ou exigir atendimento (padrão enganoso e risco legal).
- Teste grátis que cobra sem lembrete.
- Comparativo de planos com 20 linhas de ✓.

## Referências
- Deceptive Patterns, Hard to cancel: https://www.deceptive.design/types/hard-to-cancel
- Baymard, Product page e pricing: https://baymard.com/research/product-page
