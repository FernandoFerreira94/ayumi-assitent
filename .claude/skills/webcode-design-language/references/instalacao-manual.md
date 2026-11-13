# Tokens sem a CLI do shadcn (cópia manual)

Caminho padrão é o registry: `npx shadcn@latest add @webcode/theme-<nome>` (ADR 0004). Use esta cópia só quando a CLI não serve (projeto sem shadcn, HTML puro, React Native).

Os arquivos prontos estão em `assets/` da skill (gerados pelo build, não edite):
- `assets/css/<tema>.css` → variáveis `--wc-*` com claro, escuro (`prefers-color-scheme` e `[data-mode]`), reduced motion e reduced transparency.
- `assets/css/shadcn-bridge.css` → mapeia as variáveis do shadcn (`--background`, `--primary`, `--ring`…) para `--wc-*`. Substitui o bloco de variáveis padrão do shadcn.
- `assets/tailwind/theme.css` → `@theme inline` com utilitários `bg-surface`, `text-fg-muted`, `border-border`, `rounded-lg`, `ease-wc-out`, `font-display`…
- `assets/json/<tema>.json` → valores resolvidos para React Native/Expo (chave `mobile`: controles ≥ 44px, `text-body` 17 no padrão iOS).

```css
/* app/globals.css */
@import "tailwindcss";
@import "./wc/aurora.css";        /* copiado de assets/css */
@import "./wc/shadcn-bridge.css";
@import "./wc/theme.css";         /* copiado de assets/tailwind */
```

- **Fontes:** carregue com `next/font/google` (URL de referência no topo de cada CSS de tema) e aponte a variável da fonte para o nome da família.
- **Toggle de tema:** `data-mode="light|dark"` ou classe `.dark` (next-themes) no `<html>`; sem nada, segue o sistema.
