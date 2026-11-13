---
id: ecommerce
title: E-commerce
family: Commerce
summary: Loja com catálogo, página de produto, carrinho e checkout. O design serve à velocidade de decisão e à confiança no pagamento.
kpi: Conversão de sessão em pedido (1,5–3% é a média BR) e abandono de carrinho (meta abaixo de 70%)
themes: [aurora, editorial, clean-saas]
patterns: [glass-sticky-header, view-transition-morph, skeleton-shimmer, bottom-sheet, press-spring-button, toast-stack, copy-feedback, empty-state, top-progress-bar, list-enter-exit, tilt-card, cep-address-autofill, cpf-cnpj-field, otp-code-input, mega-menu, breadcrumb-overflow, skip-link-focus, async-button-states, progress-stepper, price-pix-installments, product-gallery, mini-cart-drawer, pix-copy-paste, shipping-cep-calculator, conversion-funnel, hide-on-scroll-header, search-header, apple-expand-menu, drilldown-drawer-menu, auth-sliding-panels, auth-animated-tabs, password-recovery-flow, footer-ecommerce-br, load-more-infinite, hero-carousel-autoplay, lightbox-zoom, order-tracking, faq-accordion]
density: comfortable
radius: 12
components: [button, input, field, select, radio-group, card, carousel, drawer, sheet, dialog, sonner, skeleton, badge, accordion, tabs, input-otp]
status: stable
---

## Objetivo
Encontrar, decidir e pagar com o menor atrito possível, principalmente no celular (70%+ do tráfego).

## Mapa de páginas
| Página | Elementos obrigatórios | Padrões |
| --- | --- | --- |
| Home | busca, categorias, ofertas, prova de confiança (frete, troca, avaliações) | glass-sticky-header |
| Listagem (PLP) | filtros em sheet no mobile, ordenação, contagem de resultados, cards com preço e parcelamento | bottom-sheet, skeleton-shimmer, empty-state |
| Produto (PDP) | galeria, preço, Pix com desconto, parcelas, variações, frete por CEP, avaliações, CTA fixo no mobile | view-transition-morph |
| Carrinho | itens editáveis, cupom, cálculo de frete, total claro | list-enter-exit, toast-stack |
| Checkout | identificação, entrega, pagamento (Pix, cartão, boleto), revisão | press-spring-button, copy-feedback |
| Pedido confirmado | número, Pix copia e cola com QR, prazo, próximos passos | copy-feedback |

## Regras
- Preço sempre com as três leituras brasileiras: à vista no Pix, parcelado no cartão e preço cheio riscado quando houver.
- CTA "Adicionar à sacola" fixo no rodapé do mobile na PDP.
- Checkout sem header de navegação (só logo e "compra segura") para não vazar o usuário.
- CEP preenche endereço automaticamente. Frete aparece antes do checkout.
- Adicionar ao carrinho não leva para o carrinho: confirma com toast ou mini-sheet e deixa continuar comprando.

## Estados críticos
- Produto esgotado: botão "Avise-me", nunca só desabilitado.
- Busca sem resultado: sugestões e limpar filtros (empty-state).
- Pix aguardando: contador de expiração e confirmação automática quando o pagamento cai.
- Erro de cartão: motivo legível ("cartão recusado pelo banco"), dados preservados.

## Performance
- Imagens AVIF/WebP com `width`/`height`, `srcset` e lazy fora da primeira dobra.
- Navegação PLP → PDP com prefetch no hover/viewport.

## Anti-padrões
- Pop-up de newsletter no primeiro segundo.
- Cadastro obrigatório antes de comprar (ofereça compra como convidado).
- Frete revelado só no último passo.
