---
id: realestate
title: Imobiliário
family: Serviços e verticais
summary: Portal ou site de imobiliária e incorporadora. Busca por mapa e filtros, fotos que vendem e contato rápido com o corretor.
kpi: Leads qualificados por imóvel e agendamentos de visita
themes: [editorial, aurora]
patterns: [glass-sticky-header, editorial-type-hero, bottom-sheet, anchored-popover, view-transition-morph, skeleton-shimmer, scroll-reveal-stagger, copy-feedback, empty-state, filter-chips, product-gallery, transparent-hero-header, lightbox-zoom, load-more-infinite, mega-menu, search-header, footer-big-type, time-slot-picker, chat-thread]
density: spacious
radius: 8
components: [button, card, carousel, sheet, drawer, dialog, popover, select, toggle-group, tabs, badge, field, input, calendar, accordion]
status: stable
---

## Objetivo
A pessoa encontra imóveis que cabem no bolso e no bairro certo, se imagina morando lá pelas fotos e fala com alguém sem preencher um formulário longo.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Home | busca (comprar/alugar, local, tipo, faixa de preço), lançamentos, bairros | editorial-type-hero |
| Resultados | lista + mapa sincronizados (mobile alterna), filtros em chips, ordenar, salvar busca | anchored-popover, bottom-sheet |
| Imóvel | galeria tela cheia, preço + condomínio + IPTU, metragem, quartos, vagas, mapa do entorno, corretor | view-transition-morph |
| Contato | WhatsApp com mensagem pré-preenchida citando o imóvel, agendar visita | copy-feedback |
| Lançamento | plantas, tabela de unidades, andamento da obra, simulação | scroll-reveal-stagger |

## Regras
- Custo mensal total explícito no aluguel (aluguel + condomínio + IPTU + seguro).
- Fotos primeiro, todas com proporção consistente; planta baixa como foto destacada.
- Mapa nunca é a única forma de ver resultados; lista acessível equivalente.
- Código do imóvel visível e copiável (o cliente cita no WhatsApp).
- Salvar e comparar imóveis sem login obrigatório (login só para sincronizar).

## Recomendações
- **Tema:** Editorial para imobiliária premium e incorporadoras; Aurora para portais e proptechs.
- **Densidade:** espaçosa no imóvel, confortável nos resultados.
- **Componentes-chave:** Carousel de fotos, Sheet/Drawer de filtros, Popover de faixa de preço, Calendar para visita.

## Estados críticos
- Imóvel vendido/alugado: marca e sugere similares.
- Busca sem resultados: alarga o raio ou a faixa de preço automaticamente com aviso.
- Fotos carregando: placeholder com cor média (blur hash) e skeleton.

## Anti-padrões
- "Consulte o preço".
- Formulário de 8 campos para falar com o corretor.
- Mapa pesado que trava o celular.

## Referências
- Baymard, Product page (galeria e informações-chave): https://baymard.com/research/product-page
- Baymard, Filtering UX: https://baymard.com/research/ecommerce-product-lists
