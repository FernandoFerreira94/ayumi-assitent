# Checklist antes de entregar UI

Consolida Vercel Web Interface Guidelines, Rauno Freiberg, Emil Kowalski, NN/g e WCAG 2.2. Rode uma vez, corrija, e siga. Não faça mais de uma passada completa. Para aprofundar uma área, use os guias em `guidelines/`.

## Estados
- [ ] Padrão, hover, press, foco, desabilitado, carregando, vazio, erro e sucesso existem para cada componente interativo.
- [ ] Loading > 300ms usa skeleton com o formato do conteúdo; < 300ms não mostra nada.
- [ ] Vazio ensina e oferece ação. Erro diz o que houve e como resolver, preservando o que o usuário digitou.

## Teclado e foco
- [ ] Tudo funciona só com teclado, em ordem lógica. Foco visível (`--wc-focus`).
- [ ] Esc fecha overlays e o foco volta para quem abriu. Modais prendem o foco (use `dialog` nativo ou primitivo do shadcn).
- [ ] Enter envia formulários; atalhos aparecem em menus/tooltip.

## Mobile
- [ ] Alvos ≥ 44px, inputs com `font-size` ≥ 16px (evita zoom no iOS), `inputmode`/`autocomplete` corretos.
- [ ] Sem scroll horizontal em 360px. `env(safe-area-inset-*)` em elementos fixos.
- [ ] Hover não é o único jeito de descobrir uma ação.

## Visual
- [ ] Só tokens semânticos. Nenhum hex literal ou paleta primitiva em componente.
- [ ] Claro e escuro conferidos. Vidro só em barras/controles/sheets.
- [ ] Números tabulares em colunas, títulos com `text-wrap: balance`, nada de texto cortado sem `title`/tooltip.
- [ ] Alinhamentos consistentes: mesmas bordas, paddings e baselines entre irmãos.

## Movimento
- [ ] Toda animação explica, confirma ou dá continuidade. Uma "assinatura" por página no máximo.
- [ ] Só transform/opacity/filter. Durações dos tokens. Reduced motion respeitado.

## Copy
- [ ] Botões dizem a ação ("Emitir nota"), não "OK"/"Enviar". Confirmação diz o resultado ("Nota emitida").
- [ ] Botão no infinitivo ("Salvar"), instrução com "você", capitalização de frase, plural com `Intl.PluralRules` (nada de "item(s)" ou "(a)"). Detalhes: `webcode-interface-craft/references/ux-writing.md`.
- [ ] Termos do usuário, não do sistema. Valores em formato brasileiro (R$ 1.234,56; 27/10/2026).

## Testes de 1 minuto
- [ ] Desfoque e escala de cinza: a primária e os grupos continuam claros. 5 segundos: dá para dizer o que é e o que fazer. (`webcode-interface-craft/references/metodos.md` §5)

## Performance
- [ ] Imagens com `width`/`height`, AVIF/WebP, lazy fora da dobra. Fonte com `display=swap`.
- [ ] Nenhuma lib adicionada para algo que o CSS nativo resolve.
