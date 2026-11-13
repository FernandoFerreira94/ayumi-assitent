---
id: landing-premium
title: Landing premium (estilo galeria)
summary: Topo com menu que muda de forma, hero com print que endireita, recursos com ícone 3D, CTA de fim e rodapé de letra gigante.
intent: [landing premium, site de marketing, página de lançamento, site bonito, estilo awwwards, hero com shader, rodapé grande]
group: paginas
platform: web
products: [landing, launch, saas, institutional]
components: [morph-nav, hero-section, icon-3d, card, cta-section, site-footer, shader-background, ink-button, button]
status: beta
---
## Quando usar
Site público que precisa impressionar e converter (lançamento, SaaS, estúdio). App logado ou ERP: não.

## Estrutura
```
morph-nav (bar, sticky; ≤5 itens; 1 CTA) · anúncio opcional
hero-section centered: HeroBadge · h1 · 2 ações (1 primária) · prova · HeroMedia
recursos: grade 3 col de card com icon-3d (um material só)
cta-section banner (brand) · ou newsletter
site-footer big-type (ou cta)
```

## Comandos perto do contexto
- O mesmo texto de CTA no topo, no hero e no banner final.
- `note` do CTA responde a objeção ("Sem cartão").

## Material e movimento
Um efeito de assinatura: o `shader-background` no hero stage **ou** o tilt do `HeroMedia`. `ink-button` só no CTA secundário. Tudo para com movimento reduzido.

## Estados
Newsletter com erro no campo e sucesso anunciado; barra fixa (`CtaStickyBar`) só depois de rolar e com fechar.

## Evitar
Shader + partículas na mesma página; texto sobre shader sem `overlay`; mega menu com 1 link; dois rodapés `footer` na página.

## Esqueleto
```tsx
<MorphNav sticky brand={<Logo/>} items={itens} actions={<Button>Começar grátis</Button>}/>
<main>
  <HeroSection eyebrow={<HeroBadge label="Novo">…</HeroBadge>} title="…" actions={<><Button size="lg">Começar grátis</Button><InkButton size="lg">Ver demo</InkButton></>} media={<HeroMedia>…</HeroMedia>}/>
  <section className="grid gap-4 md:grid-cols-3"><Card><Icon3D icon={ZapIcon}/>…</Card>…</section>
  <CtaSection tone="brand" title="…" actions={<Button>Começar grátis</Button>} note="Sem cartão"/>
</main>
<SiteFooter variant="big-type" wordmark="Marca" brand={<Logo/>} columns={cols}/>
```
