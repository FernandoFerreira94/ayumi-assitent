---
id: galeria-curadoria
title: Galeria de curadoria (diretório de referências)
summary: Acervo de sites, peças ou componentes escolhidos à mão: hero com números e newsletter, filtros por categoria ou faceta, grade de cartões e anúncio rotulado.
intent: [galeria, curadoria, diretório de sites, inspiração, acervo, biblioteca de componentes, showcase, explorar]
group: paginas
platform: web
products: [landing, saas, devtools, institutional]
components: [hero-section, waitlist-form, pill-filter, facet-bar, color-filter, project-card, inspiration-grid, command, kbd, load-more, empty, skeleton]
status: beta
---
## Quando usar
Site cujo produto é o acervo (sites, logos, componentes, 3D). Loja com preço e carrinho: `vitrine-produtos`.

## Estrutura
```
topo: logo | busca com ⌘K (command + kbd) | Enviar (CTA)
hero centered: frase de contexto, título curto, stats em linha, waitlist-form com consent
filtros: pill-filter (1 eixo, "+N mais" e cor/ordenar no end) OU facet-bar (vários eixos + Embaralhar)
grade: project-card site (print + domínio ↗) ou inspiration-grid (mural); 1 anúncio a cada 12, rotulado
load-more "Mostrando 24 de 574" · newsletter de novo no rodapé
```

## Comandos perto do contexto
- Filtro ativo sempre visível: na fileira (pill-filter) ou em ficha removível (facet-bar).
- Salvar e abrir ↗ no cartão; Enviar site no topo, não no meio da grade.
- Total de resultados ao lado dos filtros, anunciado ao mudar.

## Material e movimento
O print é a cor: cartões neutros, borda fina, sem sombra. Hover só sobe a seta e aproxima o print 3%. Troca de filtro com `stagger trigger="queue"`; reduzido aparece direto.

## Estados
`skeleton` na proporção do print (16:10). Sem resultado: `empty` com o filtro mais restritivo e "Limpar filtros". Newsletter: aceite desmarcado, erro na caixa.

## Evitar
Anúncio sem rótulo; mais de 7 pílulas à vista; Embaralhar em lista por relevância; números do hero sem fonte real; autoplay de vídeo com som nos cartões.

## Variações
- Biblioteca de micro-interações: pill-filter `soft` por gesto (Passar o mouse, Pressionar, Arrastar…), demo ao vivo no cartão.
- Diretório escuro: tema `devtool` ou `cinematografico`.
- Por cor: `color-filter` no `end` do pill-filter.

## Esqueleto
```tsx
<HeroSection title="A web em 3D, num lugar só." stats={[{ value: "574", label: "experiências" }]}
  actions={<WaitlistForm onJoin={join} consent={<>Aceito receber e-mails. <a href="/termos">Termos</a></>} />} />
<PillFilter options={cats} value={cat} onValueChange={setCat} end={<ColorFilter … />} />
<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <li><ProjectCard variant="site" title="ponto.studio" href="…" cover={<img …/>} external /></li>
</ul>
<LoadMore />
```
