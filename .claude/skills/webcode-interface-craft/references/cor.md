# Cor: proporção 60/30/10 e neutros que não são puros

Regra de uso da cor numa tela, mapeada aos tokens do tema. Vale para qualquer tema e modo (claro/escuro). Nunca escreva hex: o papel da cor vem do token.

## 60 / 30 / 10
| Fatia | Papel | Tokens | Onde |
|---|---|---|---|
| 60% dominante | Fundos e grandes áreas | `bg`, `surface`, `sunken` | Fundo da página, seções, espaço em branco |
| 30% apoio | Estrutura e agrupamento | `surface-raised`, `border`, `accent-soft`, `fg-muted`, cor de série de gráfico | Cards, seções alternadas, gráficos, ilustrações |
| 10% destaque | O que merece atenção | `accent-solid` + `accent-solid-fg`, `accent`, `focus` | CTA primário, item ativo, ícone-chave, número importante |

Regras de aplicação:
- **Um destaque por tela.** Se dois CTAs disputam, rebaixe um para `variant="outline"`/`soft`. Destaque em tudo vira ruído.
- **Estados semânticos** (`success`, `warning`, `destructive`) não contam como destaque da marca: use só quando há significado.
- **Texto** fica em `fg` e `fg-muted` (nunca `fg-subtle`, que não passa em 4.5:1). Texto em cor de destaque só se o par passa (`accent` sobre `bg`/`surface` é conferido pelo build).
- **Hierarquia vem da proporção**: se tudo é 60 ou tudo é 10, a tela não tem foco. Teste do aperto de olhos: desfoque a tela, o único ponto que sobra deve ser a ação principal.
- **Escuro**: a proporção se mantém; o 60% passa a ser `bg` escuro e o destaque continua pequeno. Não inverta clareando o destaque até virar fundo.
- **Exemplos de referência** mostram marcas com neutro claro, preto e um amarelo; aqui o tema decide as três cores. Não copie marca nem paleta do exemplo.

## Checagem rápida (revisão de tela)
1. Quanto da área é `bg`/`surface`? (esperado ~60%)
2. Cards, seções e gráficos usam a mesma família de apoio? (~30%)
3. Quantos elementos usam `accent-solid`? (poucos; um CTA primário por vista)
4. O destaque ainda lê em claro e escuro, e com daltonismo (não é a única pista)?
5. Alguma superfície em cor viva cobrindo mais de ~1/3 da tela? Rebaixe para `accent-soft`.

## Evite cor pura
Preto `#000`, branco `#FFF` e primárias saturadas (laranja, azul, verde, vermelho puros) cansam e parecem genéricos. Prefira neutros e matizes com leve tom e profundidade: tons de grafite no lugar do preto, off-white quente ou frio no lugar do branco, e para cada matiz de marca uma escala (clara, média, escura, apagada).
- No tema: o fundo escuro do DS já é grafite (nunca preto puro), o branco do `surface` é o `gray.0` do tema. Não force `#000`/`#FFF` fora do build de vidro (que testa sobre preto e branco só para provar contraste).
- Presets de paleta (Personalizar/Estúdio) seguem: cada matiz traz 4 a 6 degraus de escuro a claro, pelo menos um neutro de apoio e um par de texto com AA. O build confere contraste; a proporção 60/30/10 é conferida na revisão (`webcode-design-review`).
- Escala útil por matiz: **profunda** (fundo escuro/texto), **base** (destaque), **média** (apoio), **clara** (superfície), **apagada** (borda e texto secundário).
