---
name: webcode-components
description: Biblioteca de componentes React @webcode (registry shadcn da WebCodeFF). Use ao instalar, escolher ou usar componentes @webcode num projeto (Button, Dialog, Sheet, Sonner, DataTable, AppShell, inputs BR de CPF/CNPJ, CEP, moeda e data…), ao decidir entre @webcode e @shadcn, ao atualizar componentes já instalados, ou ao criar/alterar um componente no repo webcode-design. Gatilhos: "instala o componente", "qual componente uso para…", "tem input de CPF?", "adiciona @webcode/…", "atualiza os componentes do DS".
---

# WebCode Components (@webcode)

Componentes shadcn/ui com o acabamento WebCode: **mesma API e nomes do shadcn**, só acrescentando props. Esta skill cobre só a biblioteca: visual e tokens ficam na `webcode-design-language`; telas e blueprints, na `webcode-ui-patterns`.

## Quando usar
- Instalar o registry, um tema ou componentes num projeto Next.js + Tailwind v4 + shadcn.
- Escolher entre componentes parecidos (dialog × sheet × drawer, toast × alert…) ou entre @webcode e @shadcn.
- Atualizar componentes @webcode já instalados.
- Criar ou alterar componente no repo `webcode-design` → `references/criar-componente.md`.
- Montar a tela inteira → `webcode-ui-patterns` (receitas) e `webcode-interface-craft` (método).

## 1. Instalar
1. `components.json`:
   ```json
   "registries": { "@webcode": "https://webcode-design.vercel.app/r/{name}.json" }
   ```
   Público, sem token. Projeto antigo com a URL do `raw.githubusercontent.com` + `GITHUB_TOKEN`: troque por esta.
2. Tema (uma vez): `npx shadcn@latest add @webcode/theme-<nome>` (lista e escolha: `webcode-design-language` §1 ou `list_themes` do MCP).
3. Componentes: `npx shadcn@latest add @webcode/button @webcode/dialog …`. Dependências entre itens (`@webcode/utils`, `br`, `use-mask`) vêm junto. `get_install_command` do MCP monta o comando e valida os nomes.

Projeto já tem `components/ui/<nome>.tsx` do shadcn? `add @webcode/<nome>` sobrescreve: confira o diff (a API é compatível; customizações locais se perdem).

**Atualizar** um `@webcode` já instalado: não reinstale por cima. O `npm run sync` do repo webcode-design compara com a biblioteca pelo `webcode-ds.lock.json` do projeto, aplica só o que não foi customizado e mostra o diff do resto (`docs/sincronizar.md`). Tema antes dos componentes; leia o CHANGELOG desde a versão do lock.

## 2. Escolher
1. Procure no catálogo (`data/catalogo.md`, por grep) ou com `search_components` do MCP. Existe em @webcode → use ele. Componentes parecidos estão em **Famílias** (no mesmo arquivo) com o "quando usar" de cada um; `beta` pode mudar em minor, `descontinuado` aponta o substituto.
2. Não existe → use `@shadcn/<nome>`: herda o tema pela ponte de tokens. Ajuste o que as Regras pedem.

Escolhas que mais erram:
| Situação | Use | Não use |
| --- | --- | --- |
| Confirmar ação destrutiva rara | `alert-dialog` (foco inicial no Cancelar) | `dialog` |
| Tarefa curta com formulário | `dialog` (`dismissible={false}` se tiver dado digitado) | página nova |
| Detalhe ao lado da lista, desktop | `sheet` side="right" | `dialog` |
| Ações e filtros no celular | `drawer` (arrastar + botão) | `popover` |
| Resultado de ação (salvo, desfeito, erro) | `sonner` com ação "Desfazer" e `toast.promise` para assíncrono | `alert` |
| Aviso persistente da página | `alert` ou `banner` | toast |
| CPF/CNPJ, CEP, R$, data | `input-document`, `input-cep`, `input-currency`, `input-date` | `input` com máscara manual |
| Lista grande com ordenação/filtro | `data-table` | `table` cru |
| Casca de app (sidebar, topo, celular) | `app-shell` | montar à mão |

## 3. Usar
- **Combinar antes de usar:** nunca entregue componente solto. Uma receita por tela: `find_recipe` do MCP (query → id; a receita já traz a ficha de cada componente) ou `data/composicao/INDICE.md` da `webcode-ui-patterns` → `receitas/<id>.md`.
- **Ofereça variação:** em pedido aberto, mostre 2–3 versões mudando um eixo com props que já existem: material (`variant="soft"`/`"glass"`, `material="glass"`, `glassVariant({ effect: "liquid"|"acrylic" })`), densidade do tema, coreografia (`stagger`, `swap`, `presence-list`). Método: `webcode-interface-craft/references/metodos.md` §3.
- Import pelo alias do projeto: `import { Button } from "@/components/ui/button"`.
- Props extras mais úteis: `Button loading`, variantes `soft`/`glass`; `Dialog`/`Sheet` `dismissible={false}`; `DialogBody` rolável; `Dialog mobile="sheet"`; `Checkbox` indeterminado; `Table` densidade e `stickyHeader`; `Tabs` com indicador deslizante; vidro do iOS: `variant="glass"` (Button, Card, Tabs, ToggleGroup, Tooltip) e `material="glass"` (menus, Select, Popover, Sheet, Dialog, Drawer, Toaster, Menubar, Sidebar), mais `tab-bar`, `navigation-bar` e `progressive-blur`. Barra fixa de vidro com `glassBleed()`.
- Lista mobile com ação por gesto (ex.: ordens de serviço): `card-acao-lateral` (`presetColinasOS` para o Colinas OS).
- Tour de primeiro acesso: `tour` (`TourProvider` com `id`, `version`, `userId`, `variant`, `enabled`, `storage`; `TourTrigger` no menu de ajuda). Regras em `webcode-design-language/references/guidelines/ux.md`.
- O que mudou por componente, com exemplos e playground: site do DS, página **Componentes** (`/componentes/#<nome>`), ou `get_component` do MCP.

## Regras
- Tokens via classes Tailwind (`bg-primary`, `text-brand`, `bg-card`, `duration-(--wc-motion-duration-fast)`); nada de hex e nada de `dark:` (os tokens já trocam no escuro).
- Superfície própria de componente = `bg-card`; a página/palco é `bg-background`.
- Foco: `focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring` (no Tailwind v4 `outline-none` sozinho apaga o foco).
- Alvo de toque ≥ 44px em ponteiro grosso; estado nunca só por cor; textos em pt-BR.
- Motion: entrada mais lenta que a saída, só `transform`/`opacity`, desligado com movimento reduzido.
- Com shadcn, `accent` é fundo de hover; o acento da marca é `brand` (`text-brand`).
- Estabilidade: item `stable` só muda nome/props em major; `beta` pode mudar em minor; `deprecated` aponta `replacedBy` (detalhes em `references/criar-componente.md`).

## Referências (sob demanda)
- `data/catalogo.md` (gerado do registry): todos os itens e as famílias com "quando usar". **Não leia inteiro:** grep pelo nome (`grep -n "\`sheet\`" data/catalogo.md`) ou `search_components`.
- `references/criar-componente.md`: criar ou alterar componente no repo, estabilidade e versão.

## Outras skills WebCode
- `webcode-design-language`: temas, tokens e regras fixas.
- `webcode-ui-patterns`: receitas de composição, padrões e blueprints.
- `webcode-interface-craft`: método para criar a tela.
- `webcode-design-review`: revisar antes de entregar.
