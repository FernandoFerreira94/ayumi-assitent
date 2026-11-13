---
id: footer-big-type
title: Footer editorial com tipografia gigante
category: footer
summary: Footer invertido de agência/portfólio: convite grande para contato, e-mail com sublinhado animado, endereço com hora local ao vivo, redes, voltar ao topo e a marca em tipografia que ocupa a largura toda e sobe ao entrar na tela.
themes: [editorial, aurora, clean-saas, cinematografico, brutalista]
products: [portfolio, institutional, event, launch, editorial, realestate]
motion: medium
tech: css-js
deps: []
a11y: A marca gigante é decorativa (aria-hidden) e repetida em texto no ©. Hora local em time com datetime. Sublinhado do e-mail aparece também no foco. A entrada das letras não acontece em reduced motion.
perf: Tamanho da marca em unidades de container (cqi) pelo nº de letras, sem medir texto. IntersectionObserver dispara a entrada uma única vez. Relógio atualiza a cada minuto alinhado ao minuto, não a cada segundo.
reference_name: Sites de estúdios premiados (Awwwards, Locomotive)
reference_url: https://locomotive.ca
react: Server component para o conteúdo; o relógio e a entrada são um client component pequeno. Use Intl.DateTimeFormat com timeZone do escritório.
status: stable
---

## Quando usar
- Portfólios, agências, estúdios, eventos e marcas onde o footer é o último momento de impressão.

## Evite
- Em sites de conteúdo denso ou e-commerce: a pessoa quer links úteis, não espetáculo.
- Marca gigante como texto real repetido: leitor de tela lê duas vezes.

## Implementação
- Container com `container-type: inline-size`; marca com `font-size: calc(150cqi / var(--n))` (n = nº de letras; ajuste o 150 à largura da fonte) e `line-height: .8` para encostar na base.
- Cada letra em `<span style="--i:n">` com `translate: 0 100%` → `0` e atraso por índice; classe ligada pelo observer.
- Fundo `--wc-fg` e texto `--wc-bg` (inversão funciona nos dois modos).
- Relógio: `setTimeout` até o próximo minuto e depois `setInterval(60000)`.
