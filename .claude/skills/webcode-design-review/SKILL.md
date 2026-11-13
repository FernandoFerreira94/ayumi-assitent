---
name: webcode-design-review
description: Revisão de design WebCode com nota por critério, severidade e correção aplicada. Use quando pedirem para revisar, criticar ou auditar uma tela, componente, fluxo, screenshot ou PR de UI, ao comparar direções/variações, ou antes de entregar uma tela importante. Gatilhos: "revisa essa tela", "o que melhorar aqui?", "está bom para entregar?", "qual dessas versões é melhor?", "audita o visual".
---

# WebCode Design Review

Avaliação estruturada de uma interface pronta (ou quase), com nota, plano e correção. Para criar a tela, use `webcode-interface-craft`; o checklist rápido de entrega fica na `webcode-design-language` (`references/checklist.md`).

## Quando usar
- Revisar tela, componente, fluxo, screenshot ou PR de UI antes de entregar.
- Comparar direções ou variações lado a lado (crítica rápida, sem nota).
- Só conferir a entrega de uma tela simples → checklist da `webcode-design-language` basta.

## 1. Contexto (antes de opinar)
- O que é, para quem, com que frequência é usada e qual a ação principal. Falta algo? Assuma o mais provável e diga qual foi a suposição.
- Projeto com Penpot/Design Freeze ou `DESIGN.md`: revise **contra eles**; a skill não muda decisão aprovada, só aponta.
- Estágio: exploração (foco em estrutura e fluxo) ou acabamento (foco em detalhe). Não critique pixel numa exploração.
- **Várias direções lado a lado → crítica rápida, sem nota:** para cada direção, 2 forças, 2 riscos e 1 pergunta, ligados ao objetivo; termine recomendando uma e o que levar das outras.

## 2. Veja de verdade
Não revise de memória nem só pelo código. Capture a tela (Playwright, `npm run verify` no repo, ou screenshot do usuário) em:
claro e escuro · desktop e celular (390px) · movimento reduzido · estados: vazio, carregando, erro, texto longo · navegação por Tab.
Primeira impressão em 2 segundos: o que o olho vê primeiro? É o certo?

## 3. Dê a nota (0, 1 ou 2 por critério)
| # | Critério | 2 = bom quando |
| --- | --- | --- |
| 1 | Objetivo | A ação principal é óbvia em 2 s e há só uma |
| 2 | Hierarquia | Ordem de leitura clara por tamanho, peso e espaço; secundário rebaixado |
| 3 | Conteúdo | Texto real, pt-BR, R$ e datas corretos, pior caso (nome longo, 0 e 10 mil itens) resolvido |
| 4 | Estados | Vazio, carregando, erro, sucesso, desabilitado e offline existem e orientam |
| 5 | Interação | Teclado completo, foco visível, alvos ≥ 44px no toque, gesto com alternativa, estado na URL, Esc sai |
| 6 | Feedback | Toda ação responde < 100ms; desfazer em vez de confirmar quando reversível; erro ao lado do campo |
| 7 | Acessibilidade | Contraste AA (texto 4.5:1, UI 3:1), estado não só por cor, rótulos e ARIA corretos, zoom 200% |
| 8 | Consistência | Só tokens `--wc-*` (nenhum hex), componentes do sistema, mesmo nome para a mesma coisa; cor em ~60/30/10 (`webcode-interface-craft/references/cor.md`) |
| 9 | Motion | Cada animação explica, confirma ou dá continuidade; < 300ms; saída mais curta; reduced motion ok |
| 10 | Acabamento | Alinhamento, raios concêntricos, sem borda sobrando, números tabulares, `text-wrap: balance` em títulos |
| 11 | Performance percebida | Skeleton com o layout real, nada pula (CLS), UI otimista em ação frequente |
| 12 | Caráter | Tem identidade do produto; não é só "limpo" e vazio, nem cheio de efeito gratuito |

Total /24: **20+** entrega · **15–19** ajustar antes · **< 15** refazer a estrutura.

**Ordem das passadas** (não misture): 1. estrutura e fluxo (critérios 1–4, percurso cognitivo de `webcode-interface-craft/references/metodos.md` §6) → 2. interação e acessibilidade (5–7) → 3. sistema e acabamento (8–12). Achou crítico numa passada? Anote e siga; não pule para o pixel. Lentes para cada passada (Nielsen e perguntas de checagem): `references/lentes.md`.

## 4. Classifique a severidade
- **Crítico**: impede a tarefa, perde dado, falha WCAG A/AA ou quebra no celular.
- **Alto**: confunde, atrasa ou contraria o sistema (hex, componente paralelo, toast como único aviso de erro).
- **Médio**: acabamento, consistência, motion sem propósito.
- **Baixo**: polimento.

**Crítico na hora, mesmo em tela secundária:** controle sem nome acessível · foco invisível ou controle que o teclado não alcança · animação que ignora movimento reduzido · conteúdo cortado ou inalcançável em 320px ou zoom 200% · contraste de texto/controle abaixo do mínimo · estado só por cor ou só por animação · ação destrutiva sem confirmação ou desfazer · texto truncado sem como ver inteiro · erro que não diz como sair · cor semântica contra o sentido (vermelho em ação que não destrói).

## 5. Escreva a saída
```markdown
## Revisão: <tela>  ·  nota <n>/24 (<entrega|ajustar|refazer>)
**Em uma frase:** <o que funciona e a maior oportunidade>

| # | Problema | Onde | Severidade | Correção |
| --- | --- | --- | --- | --- |

**Funciona bem:** <2–3 pontos concretos, para não perder na correção>
**Ordem de correção:** 1. … 2. … 3. …
```
Cada item segue **objetivo → elemento → efeito → porquê**: "Para fechar a venda rápido (objetivo), o botão Salvar (elemento) tem o mesmo peso do link Cancelar (efeito), então o olho não sabe onde ir (critério 2)". Nada de "melhorar o layout", nada de gosto sem critério ("não gostei do azul").

## 6. Corrija
Com acesso ao código, corrija os itens crítico e alto na mesma tarefa e mostre o antes/depois (screenshot). Liste o que ficou para depois e por quê. Não entregue só a lista quando dava para corrigir.

## Regras
- **Evidência:** cada problema aponta `arquivo:linha` ou o print. O que você não conseguiu checar fica como "não verificado", nunca como problema.
- Uma causa (token, componente compartilhado) é **um** item com todos os lugares; no máximo 15 itens, sem encher.
- Correção mais barata que resolve, nesta ordem: **apagar** (borda que o espaço resolve, ARIA que o elemento nativo dispensa) → **usar a plataforma** (elemento/controle nativo, foco do navegador) → **reusar** token ou componente `@webcode` → **corrigir o valor** → só então **acrescentar**.

## Referências (sob demanda)
- `references/lentes.md`: heurísticas de Nielsen mapeadas nos critérios e perguntas de checagem.
- `webcode-interface-craft/references/metodos.md` (§5 testes de 1 minuto, §6 percurso cognitivo) · `ux-writing.md` · `cor.md`.

## Outras skills WebCode
- `webcode-interface-craft`: criar ou refazer a tela que reprovou.
- `webcode-design-language`: tokens, regras fixas e checklist de entrega.
- `webcode-components`: componente @webcode certo para a correção.
