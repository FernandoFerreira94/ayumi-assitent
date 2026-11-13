# Manual de composição

Como montar uma tela com os componentes `@webcode`: o que vai dentro do quê, com qual material, com qual movimento, onde ficam os comandos e o que evitar. O agente lê este manual **antes** de propor uma tela, para nunca entregar componente "seco" (solto, sem contexto, sem estado, sem material).

Não cria componente novo: só combina o que já está no registry e nos tokens. O build confere cada nome citado.

## Como o agente usa (barato: ~1,1 mil tokens por tela)
1. **Ache a receita:** MCP `find_recipe({ query: "checkout" })` devolve no máximo 3 linhas; sem MCP, `INDICE.md` (gerado, ~0,7 mil tokens: regras + ids por grupo) na skill `webcode-ui-patterns`.
2. **Leia só ela:** `find_recipe({ id })` devolve a receita + a ficha de cada componente usado (~1 mil tokens, teto 4.800 caracteres); sem MCP, `receitas/<id>.md` e grep do nome em `componentes.json`.
3. Monte pelo **Esqueleto**. Sem receita para o caso: regras gerais abaixo + fichas; anote em `DESIGN-NOTAS.md`.

Nunca leia o manual inteiro, o `llms-full.txt` (~85 mil tokens) ou todas as fichas para uma tela.

## Orçamento (conferido no build)
| Peça | Limite | ≈ tokens |
| --- | --- | --- |
| Receita (arquivo inteiro) | 3.200 caracteres | 900 |
| Ficha de componente | 600 caracteres | 170 |
| Índice (regras + ids por grupo) | 3.500 caracteres | 970 |
| Leitura de uma tela (receita + fichas mínimas) | 4.800 caracteres | 1.330 |

## Regras gerais de composição (valem em toda tela)
1. **Comando perto do conteúdo**: ação da linha na linha, do card no rodapé do card, da página no `page-header`. Nada de "Salvar" global longe do que mudou.
2. **Uma primária por contêiner**; o resto `secondary`/`ghost` ou no menu `…` (`dropdown-menu`).
3. **Hover revela, toque mostra**: ação secundária com `group-hover`/`group-focus-within`; em `pointer: coarse` fica visível ou vai para `swipe-actions`. Nunca esconda a única forma de fazer algo.
4. **Compacto sem apertar**: altura por `--wc-density-*`, proximidade agrupa, valor à direita com `tabular-nums`.
5. **No máximo 3 superfícies** (página → card → item). Card em card só `flat`; vidro nunca em vidro.
6. **Material segue a função**: `card` default (conteúdo), `interactive` (card clicável), `elevated` (raro), `glass` só sobre mídia/cor. Sombra só `shadow-wc-*`.
7. **Movimento explica**: durações do tema, mola só no que se arrasta/aperta, nada infinito, respeita movimento reduzido. Em conjunto: `stagger` na entrada, `swap` na troca de estado, `presence-list` na saída, `view-transition` do card ao detalhe; um conjunto anima por vez.
8. **Todo estado tem lugar**: `skeleton` no layout real, `empty` com a ação, erro com saída, `sonner` com Desfazer, desabilitado com motivo.
9. **Destrutivo proporcional**: reversível → Desfazer; pequeno → `popconfirm`; irreversível → `alert-dialog` com o nome do que some.
10. **Mesmo verbo do botão ao toast**: "Arquivar" → "Pedido arquivado · Desfazer".

## Formato de uma receita
Arquivo `receitas/<id>.md` com frontmatter e estas seções, nesta ordem (o build exige as obrigatórias):

```markdown
---
id: configuracoes-em-card
title: Configurações em card com seções
intent: [configurações, preferências, ajustes da conta]   # frases de busca (só o find_recipe lê; não entram no índice)
group: conta             # comercio | financeiro | gestao | conta | app | comunicacao | paginas
platform: web            # web | mobile | ambos
products: [saas, admin]  # ids de produto (os mesmos dos padrões)
components: [card, accordion, item, switch, button]       # todo @webcode/x citado no texto
patterns: [ios-switch]   # opcional
status: stable           # stable | beta
---
## Quando usar          (obrigatória)
## Estrutura            (obrigatória: árvore de quem fica dentro de quem)
## Comandos perto do contexto   (obrigatória)
## Material e movimento (obrigatória)
## Estados              (obrigatória)
## Evitar               (obrigatória)
## Variações            (opcional)
## Esqueleto            (obrigatória: JSX com os componentes reais)
```

## Ficha de componente (`componentes.json`)
Uma por componente, curta:
- `role`: o papel dele numa composição (uma frase).
- `pairs`: componentes com que ele costuma ser combinado (nomes do registry, validados).
- `inside`: onde ele costuma morar (ex.: "card, sheet, linha de tabela").
- `motion`: o movimento recomendado.
- `avoid`: anti-padrões (lista).

Todo componente `registry:ui` tem ficha: o build falha se um componente novo entrar sem ela.
