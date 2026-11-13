---
id: blur-text-reveal
title: Texto que surge do desfoque
category: enter-exit
summary: Palavras entram uma a uma saindo de um desfoque leve, como nas apresentações da Apple. Para frases-manifesto e títulos de seção.
themes: [aurora, editorial, cinematografico, brutalista]
products: [landing, launch, ai-app, portfolio, event]
motion: medium
tech: css-js
deps: []
a11y: O texto completo fica num aria-label do título; as palavras animadas são aria-hidden. Reduced motion mostra o texto estático.
perf: filter blur em poucas palavras (até ~20). Acima disso, anime por linha, não por palavra.
reference_name: Apple Events (keynotes)
reference_url: https://www.apple.com/apple-events/
react: Divida as palavras no servidor; dispare a classe com IntersectionObserver num client component pequeno.
status: stable
---

## Quando usar
- Uma frase de impacto por página: manifesto, abertura de seção, encerramento.

## Evite
- Parágrafos longos e texto de interface. Desfoque em excesso cansa.

## Implementação
- JS só divide a frase em spans com `--i` e adiciona `.is-in` quando entra na tela.
- Cada palavra: `opacity 0 → 1`, `blur(8px) → 0`, `translateY(8px) → 0`, com atraso de 60ms por palavra.
