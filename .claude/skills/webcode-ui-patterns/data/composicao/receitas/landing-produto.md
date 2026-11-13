---
id: landing-produto
title: Landing de produto com preços
summary: Hero com uma promessa e um CTA, prova logo abaixo, recursos em grade, preços com plano recomendado e FAQ antes do rodapé.
intent: [landing page, página de vendas, site do produto, hero, preços, pricing, lançamento, página inicial]
group: paginas
platform: web
products: [landing, launch, saas, subscription, institutional]
components: [navigation-menu, button, text-effect, marquee, card, spotlight-card, border-beam, badge, price-tag, accordion, separator]
patterns: [aurora-glass-hero, logo-cloud-marquee, pricing-tiers, faq-accordion, testimonial-wall, glass-sticky-header]
status: stable
---
## Quando usar
Converter visitante em teste/compra. Uma promessa, uma ação. Site institucional sem venda: tire preços.

## Estrutura
```
header sticky (vidro): logo · navigation-menu (≤5) · "Entrar" (ghost) + CTA
hero: título (text-effect uma vez) + subtítulo + CTA primário + secundário link · imagem do produto
prova: marquee de logos (com Pausar) ou números
recursos: grade 3 col de card (spotlight-card opcional)
preços: 3 card; recomendado com badge + border-beam; toggle Mensal/Anual
FAQ: accordion · CTA final · footer
```

## Comandos perto do contexto
- O mesmo CTA (mesmo texto) no header, no hero, em cada plano e no fim.
- Toggle Mensal/Anual logo acima dos preços, mostrando a economia.

## Material e movimento
Uma animação assinatura por página (o `text-effect` do hero **ou** o `border-beam` do plano). Vidro só no header sobre o hero. Entrada das seções com fade curto uma vez; tudo parado no movimento reduzido.

## Estados
Preço em reais com `price-tag`; plano anual com "2 meses grátis". Formulário de contato com erro no campo.

## Evitar
Dois CTAs primários no hero; carrossel no hero; mais de um efeito assinatura; preço "a partir de" sem o que inclui; FAQ que repete os recursos.

## Variações
- SaaS B2B: logos de clientes + "Falar com vendas" ao lado do CTA.
- Produto físico: hero com foto e preço com Pix.
- Lançamento: lista de espera com contagem (`countdown`).

## Esqueleto
```tsx
<header className="sticky top-0"><NavigationMenu/><Button variant="ghost">Entrar</Button><Button>Começar grátis</Button></header>
<section><h1><TextEffect/></h1><p/><Button size="lg">Começar grátis</Button><Button variant="link">Ver demonstração</Button></section>
<Marquee/>
<section className="grid gap-4 md:grid-cols-3"><SpotlightCard/>…</section>
<section className="grid gap-4 md:grid-cols-3"><Card/><BorderBeam><Card><Badge>Recomendado</Badge><PriceTag/></Card></BorderBeam><Card/></section>
<Accordion type="single" collapsible/><Separator/>
```
