---
id: pagina-precos
title: Página de preços
summary: Ciclo mensal/anual no topo, 2–4 planos com o recomendado destacado, comparação recolhida, FAQ curto e o caminho do Enterprise.
intent: [página de preços, pricing, planos, preços, tabela de preços, assinar, mensal anual, comparar planos]
group: paginas
platform: web
products: [saas, subscription, ai-app, devtools, landing]
components: [pricing-plans, plan-comparison, accordion, button, badge]
patterns: [pricing-tiers, plan-comparison-table, faq-accordion]
status: beta
---
## Quando usar
Página pública de preços ou seção de planos da landing. Plano já assinado e cobrança: `plano-assinatura`. No app: `paywall-ios`.

## Estrutura
```
título do ganho + uma linha ("7 dias grátis no Pro. Cancele quando quiser.")
BillingToggle (mensal | anual −20%) centrado
pricing-plans columns: Básico · Pro (badge "Mais popular", highlighted) · Empresa (Sob consulta, "Falar com vendas")
plan-comparison collapsible com 3–5 grupos, cabeçalho que gruda
accordion de FAQ (cobrança, cancelar, nota fiscal, troca de plano)
```

## Comandos perto do contexto
- Assinar no próprio cartão do plano e no cabeçalho da comparação; Enterprise abre contato, não checkout.
- Ciclo anual já ligado quando ele é a oferta; o preço muda nos cartões e na comparação juntos.

## Material e movimento
Cartões `default`; só o recomendado elevado com borda da marca. Troca de ciclo sobe o número. Vidro só com foto/cor atrás (`material="glass"`).

## Estados
Logado com plano: `currentPlanId` mostra "Seu plano". Cupom na URL: preço riscado com `price-tag`. Região sem Pix/boleto: some a linha.

## Evitar
Mais de 4 planos; anual sem o total do ano; preço por semana; comparação de 20 linhas aberta; destacar 2 planos.

## Variações
- Lista compacta (`variant="list"`) para poucos planos ou página dentro do app.
- Por assento: `perSeat` e `quantity-stepper` com o total.
- Pix com desconto e parcelas: `pixDiscount`, `installments`.

## Esqueleto
```tsx
<BillingToggle value={cycle} onValueChange={setCycle} plans={plans}/>
<PricingPlans plans={plans} cycle={cycle} installments={12} onSelectPlan={assinar}/>
<PlanComparison plans={cols} groups={grupos} collapsible onSelectPlan={assinar}/>
<Accordion type="single" collapsible/>
<Badge/><Button/>
```
