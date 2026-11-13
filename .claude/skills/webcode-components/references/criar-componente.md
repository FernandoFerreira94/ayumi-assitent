# Criar ou alterar um componente (repo webcode-design)

Só vale dentro do repositório `webcode-design`. Num projeto que usa o DS, instale e use; não crie componente paralelo.

## Passos
1. Código em `site/registry/webcode/ui/<nome>.tsx`, item em `site/registry/registry.base.json` (nasce `meta.status: "beta"`).
2. Ficha de composição em `composicao/componentes.json` (role, pairs, inside, motion, avoid): o build falha sem ela.
3. Sobrepõe outro componente? Entra em `site/registry/families.json` com o "quando usar" de cada membro.
4. Demo em `site/components/demos/<nome>.tsx` + entrada em `demos/index.ts` com a lista `changes` (o que muda vs shadcn) e em `demos/lazy.ts`. Playground em `site/components/playground/` quando houver o que configurar.
5. Teste de interação em `site/scripts/interactions.mjs` com `at: "componentes#<nome>"` quando houver comportamento.
6. `npm run build` (raiz) e `npm run build && npm run verify` em `site/` (`THEMES=all` para todos os temas, `ONLY=<nome>` para rodar rápido). Commite os gerados.
7. Dependência nova exige ADR em `docs/decisions/`.
8. Suba `version` no `package.json` e escreva a entrada no `CHANGELOG.md`: é assim que os projetos recebem o aviso.

## Estabilidade (`docs/estabilidade.md`, ADR 0018)
- Desde a **1.0**: nomes de tokens, apelidos do shadcn, utilitários do tema, nomes dos itens e props/exports de item `stable` só saem ou mudam de nome em **major**.
- `beta` pode mudar em minor (o CHANGELOG avisa).
- `deprecated` continua instalável, aponta `replacedBy`, avisa só em desenvolvimento e convive 2 minors. Descontinuar pede `meta.deprecatedIn`, entrada no CHANGELOG e `deprecate()` de `@webcode/deprecate` no arquivo antigo.
- Token novo pede ADR e entrada em `tokens/contrato.json`.
