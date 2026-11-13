# Materiais: vidro e sombra

Leia ao usar vidro, sombra colorida ou qualquer efeito de superfície. Camadas e exemplos de uso: `webcode-interface-craft/references/detalhes.md` §9.

## Vidro (ADR 0014, 0022, 0023)
- **Três espessuras:** `glass-bg-thin` (ícones sobre foto), `glass-bg` (barras, tab bar, botões) e `glass-bg-thick` (menus, popovers, sheets, toasts), com `--wc-blur-glass(-thick)` e `saturate(var(--wc-glass-saturate))`. Em React use `glass()` de `@webcode/glass`; nunca repita as classes.
- **Onde:** só na camada funcional (barras, controles flutuantes, menus) e com foto, mapa ou rolagem atrás. Nunca vidro dentro de vidro; no máximo ~3 camadas visíveis. Contraste vale sobre qualquer fundo.
- **Efeitos** por `glassVariant({ effect: "liquid" | "acrylic", status })` no vidro ou num ancestral: `liquid` em controle flutuante, `acrylic` em painel grande, `status` só em aviso/chip. Barras fixas com `glassBleed()`. Nada de vidro "clear" nem refração.
- **Tingido:** `glassTint("accent"|"danger")` / Button `glass-prominent` é o vidro tingido do iOS 26, com opacidade `--wc-glass-tint` calculada pelo build (texto sólido 4.5:1 sobre preto e branco). Só na ação principal sobre mídia; um por tela.
- **Luz e lente:** `glassLight` + `useGlassLight()` = luz que segue o mouse; `thumb="lens"` no Switch/Slider.
- **Componentes** com `material="glass"`/`variant="glass"`: família Vidro no catálogo da `webcode-components`.
- **App Expo** (ADR 0024): `@webcode/native-glass`; vidro só em barras e botões.

## Sombra (ADR 0013, 0016)
- **Função** (elevação) = `shadow-wc-xs…xl` do tema.
- **Expressão** (colorida, brilho, neumorfismo, brutalista, interna, sombra de texto) = receitas de `@webcode/shadow` (`boxShadow()`, `textShadow()`, `elevationScale()`), nunca valor solto. Um estilo de expressão por área.
- Sombra não conta no contraste; com `prefers-contrast: more` vira contorno (`shadowA11y`).
