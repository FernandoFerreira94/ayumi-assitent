---
name: webcode-ui-patterns
description: Padrões de tela WebCode com demo e código (landing, header, login, formulário BR, tabela, kanban, gráfico, onboarding…), receitas de composição por intenção e blueprints por tipo de sistema (SaaS, ERP, CRM, e-commerce, dashboard, PDV…). Use ao criar ou redesenhar uma página, seção ou componente visual, ao montar uma tela com componentes @webcode, ao traduzir um nome de padrão ("skeleton", "bento", "tab bar que encolhe") ou ao iniciar um produto novo. Gatilhos: "faz uma landing", "monta o checkout", "que telas um ERP precisa?", "tem padrão de kanban?", "como se chama isso?".
---

# WebCode UI Patterns

Padrões testados (claro/escuro, mobile, reduced motion) que usam só tokens `--wc-*` da `webcode-design-language`, receitas que dizem como combinar os componentes `@webcode` numa tela, e blueprints por tipo de produto. Leia **só o que precisar**: índice primeiro, depois o item escolhido.

## Quando usar
- Montar uma tela com componentes → receita de composição (passo 2).
- Produto ou página nova → blueprint (passo 3).
- Hero, header, overlay, loading, microinteração, gráfico… → padrão (passo 4).
- Nome de padrão vindo de referência ou do usuário → vocabulário (passo 1).
- O método de criação (hierarquia, estados, 3 direções) fica na `webcode-interface-craft`.

## Passos
1. **Pedido com nome de padrão** ("skeleton", "scope bar", "holy grail", "bilhete", "tab bar que encolhe", "pull-down menu")? Procure em `data/vocabulary.json` (`term`, `pt`, `status` e o componente/padrão/blueprint a usar) ou `find_term` do MCP. `evitar` traz o substituto em `note`; `falta` ainda não existe no DS.
2. **Montar uma tela (composição)?** Leia `data/composicao/INDICE.md` (regras + ids por grupo, ~0,7 mil tokens), depois **só** `data/composicao/receitas/<id>.md` da tarefa; ficha de um componente por grep do nome em `componentes.json`. Com MCP: `find_recipe` (query → id, já traz as fichas). Nunca o manual inteiro; nunca componente solto.
3. **Produto novo ou página nova?** Ache o blueprint em `data/index.json` (`blueprints[]`, campo `product`: pode haver vários por tipo, ex. `crm` e `crm-atendimento`) e leia `data/blueprints/<id>.md` (ou `get_blueprint`). Ele define navegação, telas, padrões, recomendações (`density`, `radius`, `components`), estados críticos e anti-padrões.
4. **Ache o padrão** sem abrir a biblioteca inteira:
   ```bash
   node scripts/find.mjs --product landing --category hero
   node scripts/find.mjs --q "sheet"            # busca livre
   node scripts/find.mjs --list                 # categorias e produtos válidos
   ```
   Ou `list_patterns` do MCP, ou grep em `data/catalogo.md` (lista de ids por categoria).
5. **Leia o padrão escolhido**: `data/patterns/<categoria>/<id>/pattern.md` (quando usar, evite, implementação, a11y, perf, dica de React) e `demo.html` (referência funcional).
6. **Adapte para a stack do projeto**, não cole o demo:
   - React/Next: siga o campo `react`. Prefira o componente @webcode/shadcn equivalente quando existir (Drawer, Command, Sonner, Switch) e aplique o visual e o motion do padrão.
   - Mantenha os tokens; troque classes do demo pelas convenções do projeto (Tailwind: `bg-surface`, `text-fg-muted`, `ease-wc-out`…).
   - Troque o texto de exemplo por conteúdo real do produto.
7. **Valide** com o checklist da `webcode-design-language`.

## Regras
- Pedido aberto: use a seção `## Variações` da receita como ponto de partida das 3 direções (segura, ousada, fora da caixa) da `webcode-interface-craft`.
- Uma animação "assinatura" por página (ex.: `aurora-glass-hero` **ou** `magnetic-button` **ou** `blur-text-reveal`).
- Respeite `themes` do padrão: um padrão fora do tema do projeto precisa de justificativa.
- Em projeto com Penpot/`DESIGN.md`, o padrão se adapta ao design aprovado, nunca o contrário.
- Padrão faltando? Implemente seguindo os princípios e registre a necessidade para virar padrão no repositório `webcode-design` (não crie arquivos dentro desta skill: `data/` é gerado).

## Referências (sob demanda)
Tudo em `data/` é gerado pelo build do repo `webcode-design`:
- `data/catalogo.md`: ids dos padrões por categoria · `data/index.json`: metadados de padrões e blueprints.
- `data/composicao/INDICE.md` → `receitas/<id>.md` · `componentes.json` (fichas).
- `data/blueprints/<id>.md` · `data/patterns/<categoria>/<id>/` · `data/vocabulary.json`.
- Galeria visual com todos os demos ao vivo: `build/gallery.html` no repositório `webcode-design`.

## Outras skills WebCode
- `webcode-design-language`: tokens, temas e checklist de entrega.
- `webcode-components`: instalar e escolher os componentes que a receita cita.
- `webcode-interface-craft`: método para criar a tela e as 3 direções.
- `webcode-design-review`: revisar o resultado.
