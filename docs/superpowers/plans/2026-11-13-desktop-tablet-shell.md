# Bubbly no tablet e no desktop · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o Bubbly do celular para o iPad e o desktop (menu lateral, trilho de ícones, folhas como painel lateral, atalhos e telas em duas colunas) sem mudar nada abaixo de 768 px.

**Architecture:** Uma árvore só, responsiva por CSS. O menu lateral (`SideNav`) e a barra do rodapé (`TabBar`) ficam os dois montados e o CSS mostra um ou outro; o `PageShell` ganha largura por faixa; as 14 folhas do vaul trocam `direction` para `"right"` com um único hook de largura (`useIsWide`). As telas entram depois, uma a uma, com grades `lg:`/`xl:`.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, Tailwind CSS v4, vaul 1.1 (`Drawer`), Vitest + Testing Library (jsdom), Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-11-13-desktop-tablet-ux-ui.md` (levantamento de UX/UI; os números de achado citados abaixo são de lá). Referência visual: https://claude.ai/artifact/A6KGTMjLZNQ8TaD4inetou

## Global Constraints

- Celular intacto: abaixo de 768 px nada muda. Classe nova só com prefixo `md:`/`lg:`/`xl:` ou dentro de `@media (min-width: 48rem)`; nenhuma classe atual é removida.
- Faixas: breakpoints padrão do Tailwind v4, sem configurar nada: `md` = 48rem (768 px), `lg` = 64rem (1024 px), `xl` = 80rem (1280 px).
- Menu: trilho de 76 px de `md` até 1279 px; menu com nomes de 248 px a partir de `xl`. Painel lateral das folhas: 440 px. Coluna padrão a partir de `md`: até 720 px; telas com `wide` usam a largura toda.
- Cor só por token: `var(--primary)`, `var(--surface)`, `var(--fg)`, `var(--muted)`, `var(--line)` no CSS; `bg-surface`, `text-fg`, `text-muted`, `border-line`, `bg-primary`, `text-primary` no Tailwind. Branco sobre lavanda segue o padrão já usado em `.tab-act` (`#fff`). Sem `dark:`.
- Textos (pt-BR, iguais às pranchas): "Navegação principal", "Novo agendamento", "Painel", "Calendário", "Finanças", "Clientes", "Serviços", "Vagas", "Pendências", "Ajustes", "Perfil e conta", "Fechar", "Contexto do dia", "Seções de Ajustes".
- Alvos de toque com pelo menos 44 px; foco visível com contorno `var(--primary)`; `aria-current="page"` no item ativo.
- Nenhuma dependência nova.
- Next 16 tem mudanças de API: antes de mexer em `layout.tsx`, leia o guia de layouts em `node_modules/next/dist/docs/` (regra do `AGENTS.md` do projeto).
- Comandos: `pnpm test` (Vitest), `pnpm typecheck`, `pnpm lint`. O e2e (`pnpm test:e2e`) precisa do `.env.local` e quem roda é o Fernando.
- Trabalhe num worktree novo a partir de `origin/main` (branch `feat/desktop-tablet`), porque a pasta principal tem mudanças de outras tarefas em `globals.css`, `messaging/` e `SalonForm.tsx`. Se precisar trabalhar na pasta principal, use `git add -p src/app/globals.css` e só adicione os seus trechos.

---

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/use-media.ts` (novo) | `useMediaQuery`, `useIsWide`, `WIDE_QUERY` |
| `src/components/nav/nav-items.ts` (novo) | Lista das 8 telas do menu e `isNavActive` |
| `src/components/nav/menu-data.ts` (novo) | `getMenuData()` no servidor, com `cache` do React |
| `src/components/nav/SideNav.tsx` (novo) | Menu lateral / trilho (cliente) |
| `src/components/nav/SideNavSlot.tsx` (novo) | Busca os dados e monta o `SideNav` (servidor) |
| `src/components/nav/Shortcuts.tsx` (novo) | Atalhos de teclado globais (cliente) |
| `src/lib/shortcuts.ts` (novo) | `shortcutFor` e `shiftDay`, funções puras |
| `src/components/ui/AdaptiveSheet.tsx` (novo) | `useSheetSide`, `sheetClass`, `SIDE_PANEL`, `SidePanelClose` |
| `src/components/ui/page-main.ts` (novo) | `pageMainClass(wide)`, sem imports (os `loading.tsx` e o teste não puxam o banco) |
| `src/components/ui/PageShell.tsx` | Cabeçalho e largura por faixa, prop `wide` |
| `src/app/(app)/layout.tsx` | Monta `SideNavSlot` ao lado do conteúdo e `Shortcuts` |
| `src/app/globals.css` | CSS do menu, esconder `.tabbar` a partir de `md`, hover com mouse |
| `src/components/nav/HeaderMenu.tsx`, `TabBar.tsx` | Passam a usar `getMenuData` e `isNavActive` |
| 14 arquivos de folha | Trocam para `useSheetSide` + `sheetClass` |
| `src/features/tour/steps.ts`, `Tour.tsx` | Passo da navegação acha o menu visível |
| `playwright.config.ts`, `tests/e2e/largura.spec.ts` (novo) | Projetos iPad paisagem e desktop |
| Páginas de `src/app/(app)/` | Grades de duas colunas (Fase 2) |

---

# Fase 1 · Casca

### Task 1: Hook de largura de tela

**Files:**
- Create: `src/lib/use-media.ts`
- Test: `tests/unit/use-media.test.tsx`

**Interfaces:**
- Produces: `WIDE_QUERY: string` (`"(min-width: 48rem)"`), `useMediaQuery(query: string): boolean`, `useIsWide(): boolean`. No servidor e na hidratação devolvem `false`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/use-media.test.tsx
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WIDE_QUERY, useIsWide } from "@/lib/use-media";

function fakeMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  const spy = vi.fn((q: string) => {
    expect(q).toBe(WIDE_QUERY);
    return mql;
  });
  vi.stubGlobal("matchMedia", spy);
  return {
    set(v: boolean) {
      matches = v;
      listeners.forEach((l) => l());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useIsWide", () => {
  it("segue a largura da tela e reage ao girar o aparelho", () => {
    const mm = fakeMatchMedia(false);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);
    act(() => mm.set(true));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/use-media.test.tsx`
Expected: FAIL, "Failed to resolve import "@/lib/use-media"".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/use-media.ts
"use client";

import { useSyncExternalStore } from "react";

/** Tablet e desktop (md do Tailwind): a barra do rodapé some e as folhas abrem de lado. */
export const WIDE_QUERY = "(min-width: 48rem)";

/**
 * Lê uma media query e acompanha a mudança (girar o iPad, redimensionar a janela).
 * No servidor e na hidratação devolve false: a primeira pintura é a do celular, e folha só abre depois de um toque.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsWide = () => useMediaQuery(WIDE_QUERY);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/use-media.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/use-media.ts tests/unit/use-media.test.tsx
git commit -m "Desktop: hook de largura de tela (useIsWide)"
```

---

### Task 2: Lista única das telas do menu

**Files:**
- Create: `src/components/nav/nav-items.ts`
- Modify: `src/components/nav/TabBar.tsx` (troca o `isAt` local por `isNavActive`)
- Test: `tests/unit/nav-items.test.ts`

**Interfaces:**
- Consumes: `NAV_ICONS` de `src/components/nav/nav-icons.tsx` (chaves `painel`, `calendario`, `servicos`, `clientes`, `financeiro`, `vagas`, `pendencias`, `ajustes`, `novo`).
- Produces: `type NavItem = { href: string; label: string; icon: NavIconKey; group: "main" | "more" }`, `type NavIconKey = keyof typeof NAV_ICONS`, `NAV_ITEMS: readonly NavItem[]`, `isNavActive(pathname: string, href: string): boolean`.

O `AppMenu` (menu "De cima" do celular) fica como está: a ordem e o rótulo "Financeiro" dele são do celular e não entram neste plano.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/nav-items.test.ts
import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isNavActive } from "@/components/nav/nav-items";

describe("isNavActive", () => {
  it.each([
    ["/agenda", "/agenda", true],
    ["/clientes/123", "/clientes", true],
    ["/clientes-antigos", "/clientes", false],
    ["/vagas", "/agenda", false],
  ])("%s em %s → %s", (pathname, href, expected) => {
    expect(isNavActive(pathname, href)).toBe(expected);
  });
});

describe("NAV_ITEMS", () => {
  it("tem as 8 telas na ordem das pranchas", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Painel",
      "Calendário",
      "Finanças",
      "Clientes",
      "Serviços",
      "Vagas",
      "Pendências",
      "Ajustes",
    ]);
    expect(NAV_ITEMS.filter((i) => i.group === "main")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/nav-items.test.ts`
Expected: FAIL, "Failed to resolve import "@/components/nav/nav-items"".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/components/nav/nav-items.ts
import type { NAV_ICONS } from "./nav-icons";

export type NavIconKey = keyof typeof NAV_ICONS;
export type NavItem = { href: string; label: string; icon: NavIconKey; group: "main" | "more" };

/** Telas do menu lateral e do trilho, na ordem das pranchas: as 4 do dia a dia, separador, as outras 4. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/agenda", label: "Painel", icon: "painel", group: "main" },
  { href: "/calendario", label: "Calendário", icon: "calendario", group: "main" },
  { href: "/financeiro", label: "Finanças", icon: "financeiro", group: "main" },
  { href: "/clientes", label: "Clientes", icon: "clientes", group: "main" },
  { href: "/servicos", label: "Serviços", icon: "servicos", group: "more" },
  { href: "/vagas", label: "Vagas", icon: "vagas", group: "more" },
  { href: "/pendencias", label: "Pendências", icon: "pendencias", group: "more" },
  { href: "/ajustes", label: "Ajustes", icon: "ajustes", group: "more" },
];

/** A tela atual é a do item ou uma filha dela (/clientes/123 acende Clientes). */
export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
```

Em `src/components/nav/TabBar.tsx`, apague a linha `const isAt = (pathname: string, href: string) => pathname === href || pathname.startsWith(\`${href}/\`);`, troque `const on = isAt(pathname, t.href);` por `const on = isNavActive(pathname, t.href);` e adicione `import { isNavActive } from "./nav-items";` junto dos outros imports.

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test tests/unit/nav-items.test.ts && pnpm typecheck`
Expected: PASS (5 testes) e typecheck sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/nav/nav-items.ts src/components/nav/TabBar.tsx tests/unit/nav-items.test.ts
git commit -m "Desktop: lista única das telas do menu"
```

---

### Task 3: Dados do menu num lugar só

**Files:**
- Create: `src/components/nav/menu-data.ts`
- Modify: `src/components/nav/HeaderMenu.tsx`

**Interfaces:**
- Produces: `getMenuData(): Promise<MenuData>` com `MenuData = { userName: string; studioName: string | null; whatsapp: …; pendencias: number }` (tipo inferido). Embrulhado em `cache` do React: o avatar do celular e o menu lateral fazem uma consulta só por pedido.

Sem teste unitário: a função só junta consultas que já existem no `HeaderMenu`. A verificação é o typecheck e o menu do avatar continuar igual.

- [ ] **Step 1: Criar `menu-data.ts` com o código que hoje está dentro de `MenuWithData`**

```ts
// src/components/nav/menu-data.ts
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tenants } from "@/db/schema";
import { countPendencias } from "@/features/appointments/pendencias";
import { shellStatus } from "@/features/shell/status";
import { requireTenant } from "@/lib/tenant";

/** Dados do menu do avatar (celular) e do menu lateral (tablet/desktop). `cache`: uma consulta por pedido. */
export const getMenuData = cache(async () => {
  const { tenantId, userName } = await requireTenant();
  const [{ whatsapp, pendencias }, [tenant]] = await Promise.all([
    shellStatus(tenantId),
    getDb().select({ name: tenants.name, ownerName: tenants.ownerName }).from(tenants).where(eq(tenants.id, tenantId)),
  ]);
  return {
    userName: tenant?.ownerName || userName,
    studioName: tenant?.name ?? null,
    whatsapp,
    pendencias: countPendencias(pendencias),
  };
});

export type MenuData = Awaited<ReturnType<typeof getMenuData>>;
```

- [ ] **Step 2: `HeaderMenu.tsx` passa a usar `getMenuData`**

```tsx
// src/components/nav/HeaderMenu.tsx
import { Suspense } from "react";
// Default import: o bundler só garante o export default de JSON
import pkg from "../../../package.json";
import { AppMenu } from "./AppMenu";
import { getMenuData } from "./menu-data";

async function MenuWithData() {
  const m = await getMenuData();
  return (
    <AppMenu
      userName={m.userName}
      studioName={m.studioName}
      whatsapp={m.whatsapp}
      pendencias={m.pendencias}
      version={pkg.version}
    />
  );
}

export function HeaderMenu() {
  return (
    <Suspense fallback={<span aria-hidden="true" className="avatar size-11 shrink-0 rounded-full opacity-60" />}>
      <MenuWithData />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: tudo verde, sem mudança de comportamento.

- [ ] **Step 4: Commit**

```bash
git add src/components/nav/menu-data.ts src/components/nav/HeaderMenu.tsx
git commit -m "Desktop: dados do menu num lugar só (getMenuData)"
```

---

### Task 4: Menu lateral e trilho de ícones

Cobre os achados 1, 5, 6, 26, 27 e 28.

**Files:**
- Create: `src/components/nav/SideNav.tsx`, `src/components/nav/SideNavSlot.tsx`
- Modify: `src/app/globals.css` (bloco novo no fim do arquivo)
- Test: `tests/unit/side-nav.test.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `isNavActive`, `NavItem` (Task 2); `NAV_ICONS`; `openNewAppointment()` de `@/features/appointments/QuickBook`; `getMenuData()` (Task 3).
- Produces: `SideNav({ studioName: string | null; pendencias: number })` (cliente) e `SideNavSlot()` (servidor, já com `Suspense`). O `<nav>` tem `aria-label="Navegação principal"`, `data-tour="sidenav"` e classe `sidenav`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/side-nav.test.tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { openNewAppointment } = vi.hoisted(() => ({ openNewAppointment: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/clientes/42" }));
vi.mock("@/features/appointments/QuickBook", () => ({ openNewAppointment }));

import { SideNav } from "@/components/nav/SideNav";

describe("SideNav", () => {
  it("lista as 8 telas, marca a atual e mostra a contagem de pendências", () => {
    render(<SideNav studioName="Estúdio Lua" pendencias={3} />);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Painel" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Pendências 3" })).toHaveAttribute("href", "/pendencias");
    expect(within(nav).getByRole("link", { name: /Estúdio Lua.*Perfil e conta/ })).toHaveAttribute("href", "/perfil");
    // 8 telas + perfil
    expect(within(nav).getAllByRole("link")).toHaveLength(9);
  });

  it("Novo agendamento abre a folha global", () => {
    render(<SideNav studioName={null} pendencias={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo agendamento" }));
    expect(openNewAppointment).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Pendências" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/side-nav.test.tsx`
Expected: FAIL, "Failed to resolve import "@/components/nav/SideNav"".

- [ ] **Step 3: Implementar `SideNav.tsx`**

```tsx
// src/components/nav/SideNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { NAV_ICONS } from "./nav-icons";
import { NAV_ITEMS, isNavActive, type NavIconKey, type NavItem } from "./nav-items";

function NavIcon({ name }: { name: NavIconKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="sidenav-icon"
    >
      {NAV_ICONS[name]}
    </svg>
  );
}

/**
 * Navegação do tablet e do desktop. De 768 a 1279 px é um trilho de ícones (76 px; o nome fica no title e no leitor
 * de tela); a partir de 1280 px mostra os nomes (248 px). No celular fica escondida: quem navega é a barra do rodapé.
 */
export function SideNav({ studioName, pendencias }: { studioName: string | null; pendencias: number }) {
  const pathname = usePathname();
  const salon = studioName ?? "Meu salão";

  const link = (item: NavItem) => {
    const on = isNavActive(pathname, item.href);
    const count = item.href === "/pendencias" && pendencias > 0 ? pendencias : null;
    return (
      <li key={item.href}>
        <Link href={item.href} title={item.label} aria-current={on ? "page" : undefined} className="sidenav-link">
          <NavIcon name={item.icon} />
          <span className="sr-only xl:not-sr-only xl:flex-1">{item.label}</span>
          {count ? <span className="sidenav-count"> {count}</span> : null}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Navegação principal" data-tour="sidenav" className="sidenav">
      <p className="sidenav-brand">
        <span aria-hidden="true" className="sidenav-dot" />
        <span className="sr-only xl:not-sr-only">Bubbly</span>
      </p>
      <button type="button" className="sidenav-new" title="Novo agendamento (N)" onClick={() => openNewAppointment()}>
        <NavIcon name="novo" />
        <span className="sr-only xl:not-sr-only xl:flex-1 xl:text-left">Novo agendamento</span>
        <kbd aria-hidden="true" className="sidenav-kbd">
          N
        </kbd>
      </button>
      <ul className="sidenav-list">{NAV_ITEMS.filter((i) => i.group === "main").map(link)}</ul>
      <hr className="sidenav-sep" />
      <ul className="sidenav-list">{NAV_ITEMS.filter((i) => i.group === "more").map(link)}</ul>
      <Link
        href="/perfil"
        title="Perfil e conta"
        aria-current={isNavActive(pathname, "/perfil") ? "page" : undefined}
        className="sidenav-link sidenav-profile"
      >
        <span aria-hidden="true" className="sidenav-avatar">
          {salon.charAt(0).toUpperCase()}
        </span>
        <span className="sr-only xl:not-sr-only xl:grid xl:min-w-0 xl:leading-tight">
          <span className="truncate font-bold">{salon} </span>
          <span className="text-xs text-muted">Perfil e conta</span>
        </span>
      </Link>
    </nav>
  );
}
```

O espaço antes de `{count}` e depois de `{salon}` existe para o nome acessível sair "Pendências 3" e "Estúdio Lua Perfil e conta".

- [ ] **Step 4: Implementar `SideNavSlot.tsx`**

```tsx
// src/components/nav/SideNavSlot.tsx
import { Suspense } from "react";
import { getMenuData } from "./menu-data";
import { SideNav } from "./SideNav";

async function SideNavWithData() {
  const m = await getMenuData();
  return <SideNav studioName={m.studioName} pendencias={m.pendencias} />;
}

/** Reserva a largura do menu enquanto os dados chegam, para o conteúdo não pular de lado. */
export function SideNavSlot() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="sidenav-placeholder" />}>
      <SideNavWithData />
    </Suspense>
  );
}
```

- [ ] **Step 5: CSS do menu (fim de `src/app/globals.css`)**

```css
/* ── Menu lateral (tablet e desktop). Trilho de ícones até 1279 px; com nomes a partir de 1280 px. ── */
.sidenav,
.sidenav-placeholder {
  display: none;
}
@media (min-width: 48rem) {
  .tabbar {
    display: none;
  }
  .sidenav-placeholder {
    display: block;
    flex: none;
    width: 76px;
  }
  .sidenav {
    position: sticky;
    top: 0;
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: calc(76px + env(safe-area-inset-left));
    height: 100dvh;
    overflow-y: auto;
    padding: max(env(safe-area-inset-top), 16px) 0 max(env(safe-area-inset-bottom), 16px) env(safe-area-inset-left);
    background: var(--surface);
    border-right: 1px solid var(--line);
  }
  .sidenav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 800;
    color: var(--primary);
  }
  .sidenav-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--primary);
  }
  .sidenav-list {
    display: grid;
    gap: 4px;
    width: 100%;
    margin: 0;
    padding: 0 12px;
    list-style: none;
  }
  .sidenav-link,
  .sidenav-new {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 10px;
    border-radius: 14px;
    font-weight: 600;
    color: var(--fg);
  }
  .sidenav-link[aria-current="page"] {
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--primary);
  }
  .sidenav-link:focus-visible,
  .sidenav-new:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .sidenav-new {
    width: 44px;
    margin-bottom: 8px;
    color: #fff;
    background: var(--primary);
  }
  .sidenav-icon {
    width: 22px;
    height: 22px;
    flex: none;
  }
  .sidenav-count {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    place-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: var(--primary);
  }
  .sidenav-kbd {
    display: none;
  }
  .sidenav-sep {
    width: calc(100% - 24px);
    margin: 8px 12px;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .sidenav-profile {
    margin: auto 12px 0;
  }
  .sidenav-avatar {
    display: grid;
    flex: none;
    place-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-weight: 700;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 16%, transparent);
  }
}
@media (min-width: 80rem) {
  .sidenav-placeholder {
    width: 248px;
  }
  .sidenav {
    align-items: stretch;
    width: calc(248px + env(safe-area-inset-left));
    padding-inline: calc(16px + env(safe-area-inset-left)) 16px;
  }
  .sidenav-brand {
    padding-inline: 12px;
  }
  .sidenav-list {
    padding: 0;
  }
  .sidenav-link,
  .sidenav-new {
    justify-content: flex-start;
    padding: 0 12px;
  }
  .sidenav-new {
    width: auto;
  }
  .sidenav-count {
    position: static;
  }
  .sidenav-kbd {
    display: inline;
    font: inherit;
    font-size: 12px;
    opacity: 0.8;
  }
  .sidenav-sep {
    width: 100%;
    margin-inline: 0;
  }
  .sidenav-profile {
    margin-inline: 0;
  }
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm test tests/unit/side-nav.test.tsx && pnpm typecheck`
Expected: PASS (2 testes), typecheck verde.

- [ ] **Step 7: Commit**

```bash
git add src/components/nav/SideNav.tsx src/components/nav/SideNavSlot.tsx src/app/globals.css tests/unit/side-nav.test.tsx
git commit -m "Desktop: menu lateral e trilho de ícones"
```

---

### Task 5: Casca do app e cabeçalho por faixa

Cobre os achados 2, 3, 4, 14 e 25.

**Files:**
- Create: `src/components/ui/page-main.ts`
- Modify: `src/app/(app)/layout.tsx`, `src/components/ui/PageShell.tsx`
- Modify: `src/app/(app)/vagas/loading.tsx`, `src/app/(app)/servicos/loading.tsx`, `src/app/(app)/clientes/loading.tsx` (trocam a classe do `<main>` por `pageMainClass()`)
- Test: `tests/unit/page-shell.test.ts`

**Interfaces:**
- Consumes: `SideNavSlot` (Task 4).
- Produces: `pageMainClass(wide?: boolean): string` (em `src/components/ui/page-main.ts`) e `PageShell({ title, subtitle?, back?, wide?, children })`. Sem `wide`, a partir de `md` a coluna vai até 720 px; com `wide`, usa a largura toda (as telas da Fase 2 ligam `wide`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/page-shell.test.ts
import { describe, expect, it } from "vitest";
import { pageMainClass } from "@/components/ui/page-main";

describe("pageMainClass", () => {
  it("mantém a coluna do celular nas duas variantes", () => {
    for (const cls of [pageMainClass(), pageMainClass(true)]) {
      expect(cls).toContain("max-w-[520px]");
      expect(cls).toContain("pb-36");
    }
  });
  it("tablet: coluna de 720 px; tela larga: sem limite", () => {
    expect(pageMainClass()).toContain("md:max-w-[720px]");
    expect(pageMainClass(true)).toContain("md:max-w-none");
    expect(pageMainClass(true)).not.toContain("md:max-w-[720px]");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/page-shell.test.ts`
Expected: FAIL, "Failed to resolve import "@/components/ui/page-main"".

- [ ] **Step 3: `page-main.ts` e novo `PageShell.tsx`**

A classe mora num arquivo sem imports: o `PageShell` puxa o `HeaderMenu`, que consulta o banco, e os `loading.tsx` (testados em `tests/unit/loading.test.tsx`) não podem carregar isso.

```ts
// src/components/ui/page-main.ts
const MAIN = "mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)] md:px-6 md:pb-10 md:pt-7";

/** Classe do <main> das telas e dos loading.tsx: a tela carregando tem a mesma largura da pronta. */
export function pageMainClass(wide = false): string {
  return wide ? `${MAIN} md:max-w-none lg:px-8` : `${MAIN} md:max-w-[720px]`;
}
```

```tsx
// src/components/ui/PageShell.tsx
import { BackButton } from "@/components/nav/BackButton";
import { HeaderMenu } from "@/components/nav/HeaderMenu";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { InstallHeaderButton } from "@/features/install/InstallGuide";
import { pageMainClass } from "./page-main";

/**
 * Celular: avatar (menu) ou seta à esquerda, título centralizado, sino à direita.
 * Tablet e desktop: o menu lateral já mostra onde a pessoa está, então avatar e seta somem,
 * e o título vira 24 px alinhado à esquerda com a data embaixo, como nas pranchas.
 * `wide` libera a largura toda para telas em duas colunas.
 */
export function PageShell({
  title,
  subtitle,
  back = false,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className={pageMainClass(wide)}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 pb-3 pt-2 md:flex md:gap-3 md:px-0 md:pb-5 md:pt-0">
        <div className="flex justify-start md:hidden">{back ? <BackButton /> : <HeaderMenu />}</div>
        <div className="flex min-w-0 flex-col text-center leading-tight md:flex-1 md:text-left">
          <h1 className="truncate text-[17px] font-bold md:text-2xl">{title}</h1>
          {subtitle ? <p className="truncate text-xs font-semibold text-muted md:text-sm">{subtitle}</p> : null}
        </div>
        <div className="flex items-center justify-end gap-2">
          <div data-tour="bell">
            <NotificationBell />
          </div>
          <InstallHeaderButton />
        </div>
      </header>
      {children}
    </main>
  );
}
```

- [ ] **Step 4: `loading.tsx` de vagas, serviços e clientes**

Em cada um dos três arquivos, troque
`<main className="mx-auto min-h-dvh max-w-[520px] px-4 pb-36 pt-[max(env(safe-area-inset-top),14px)]">`
por `<main className={pageMainClass()}>` e adicione `import { pageMainClass } from "@/components/ui/page-main";`.

- [ ] **Step 5: Layout do app com o menu ao lado**

Em `src/app/(app)/layout.tsx`, adicione `import { SideNavSlot } from "@/components/nav/SideNavSlot";` e troque o trecho do `<Suspense … ><AuthGate>{children}</AuthGate></Suspense>` por:

```tsx
      <div className="md:flex">
        <SideNavSlot />
        <div className="min-w-0 flex-1">
          <Suspense
            fallback={
              <LoadingRegion label="Verificando seu acesso">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-24 w-full" />
              </LoadingRegion>
            }
          >
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </div>
      </div>
```

O resto do layout (`OfflineBanner`, `TabBar`, `NavHistory`, `QuickBook`, `TourGate`, `ConversationHost`, `NoticeHost`) fica igual. A `TabBar` continua montada; o CSS da Task 4 esconde a partir de 768 px.

- [ ] **Step 6: Verificar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tudo verde (inclusive `tests/unit/loading.test.tsx`).

Depois, com o dev do Fernando aberto em `http://localhost:3000` e logado, abra `/agenda` em 390, 1024 e 1440 px de largura: em 390 nada muda; em 1024 aparece o trilho e some a barra do rodapé; em 1440 aparece o menu com nomes e o título fica à esquerda.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/layout.tsx" src/components/ui/page-main.ts src/components/ui/PageShell.tsx "src/app/(app)/vagas/loading.tsx" "src/app/(app)/servicos/loading.tsx" "src/app/(app)/clientes/loading.tsx" tests/unit/page-shell.test.ts
git commit -m "Desktop: casca com menu ao lado e cabeçalho por faixa"
```

---

### Task 6: Folhas viram painel lateral no tablet e no desktop

Cobre os achados 7, 8, 9 e 10.

**Files:**
- Create: `src/components/ui/AdaptiveSheet.tsx`
- Test: `tests/unit/adaptive-sheet.test.tsx`
- Modify (14 arquivos, confirme a lista com `git grep -l "fixed inset-x-0 bottom-0" src`):
  `src/features/appointments/AgendaDay.tsx`, `NewAppointmentSheet.tsx`, `EditAppointmentSheet.tsx`, `MonthPicker.tsx` (todos em `src/features/appointments/`), `src/features/clients/ClientRow.tsx` (3 folhas), `src/features/clients/NewClientSheet.tsx`, `src/features/contacts/ImportSheet.tsx`, `src/features/blocks/NewBlockSheet.tsx`, `src/features/finance/NewExpenseSheet.tsx`, `src/features/services/ServicesCatalog.tsx`, `src/features/messaging/ChatSheet.tsx`, `src/features/install/InstallGuide.tsx`, `src/features/salon/MascotPicker.tsx`, `src/components/ui/LetterPicker.tsx`

**Interfaces:**
- Consumes: `useIsWide()` (Task 1); `Drawer` do `vaul`.
- Produces: `type SheetSide = "bottom" | "right"`, `useSheetSide(): SheetSide`, `SIDE_PANEL: string`, `sheetClass(side: SheetSide, bottom: string, shared?: string): string`, `SidePanelClose()` (botão "Fechar", só aparece a partir de `md`).

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/adaptive-sheet.test.tsx
import { describe, expect, it } from "vitest";
import { SIDE_PANEL, sheetClass } from "@/components/ui/AdaptiveSheet";

const MOBILE = "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl";

describe("sheetClass", () => {
  it("celular mantém a folha que sobe de baixo", () => {
    expect(sheetClass("bottom", MOBILE, "sheet z-50")).toBe(`sheet z-50 ${MOBILE}`);
  });
  it("tablet e desktop usam o painel lateral e mantêm o que é comum", () => {
    expect(sheetClass("right", MOBILE, "sheet z-50")).toBe(`sheet z-50 ${SIDE_PANEL}`);
    expect(SIDE_PANEL).toContain("right-0");
    expect(SIDE_PANEL).not.toMatch(/\bz-/);
  });
  it("sem classe comum não sobra espaço", () => {
    expect(sheetClass("bottom", MOBILE)).toBe(MOBILE);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/adaptive-sheet.test.tsx`
Expected: FAIL, "Failed to resolve import "@/components/ui/AdaptiveSheet"".

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/ui/AdaptiveSheet.tsx
"use client";

import { Drawer } from "vaul";
import { useIsWide } from "@/lib/use-media";

export type SheetSide = "bottom" | "right";

/** Painel do tablet/desktop: altura toda, 440 px, colado à direita. O z-index fica com quem chama (vai em `shared`). */
export const SIDE_PANEL =
  "fixed inset-y-0 right-0 flex h-dvh w-[min(440px,100vw)] flex-col overflow-y-auto rounded-l-3xl px-6 pb-6 pt-[max(env(safe-area-inset-top),24px)] outline-none";

/** Celular: folha que sobe de baixo (como sempre). Tablet e desktop: painel à direita, que deixa a tela visível. */
export function useSheetSide(): SheetSide {
  return useIsWide() ? "right" : "bottom";
}

/** `bottom` é a classe de posição e tamanho da folha no celular; `shared` vale nos dois lados (fundo, z-index, flex). */
export function sheetClass(side: SheetSide, bottom: string, shared = ""): string {
  return [shared, side === "right" ? SIDE_PANEL : bottom].filter(Boolean).join(" ");
}

/** No painel lateral não há "puxar para baixo": botão Fechar visível. Esc também fecha (vaul). */
export function SidePanelClose() {
  return (
    <Drawer.Close
      aria-label="Fechar"
      className="absolute right-4 top-[max(env(safe-area-inset-top),16px)] hidden size-11 place-content-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-primary md:grid"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="size-5">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </Drawer.Close>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/adaptive-sheet.test.tsx`
Expected: PASS (3 testes).

- [ ] **Step 5: Migrar as 14 folhas (mesma receita em cada arquivo)**

Receita, com `NewClientSheet.tsx` como exemplo. Antes:

```tsx
<Drawer.Root open={open} onOpenChange={setOpen}>
  …
  <Drawer.Content
    className="sheet fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none"
  >
```

Depois:

```tsx
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
…
const side = useSheetSide(); // no topo do componente que renderiza o Drawer.Root
…
<Drawer.Root open={open} onOpenChange={setOpen} direction={side}>
  …
  <Drawer.Content
    className={sheetClass(
      side,
      "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none",
      "sheet z-50",
    )}
  >
    <SidePanelClose />
```

Regras da receita:
1. Posição e tamanho do celular (`fixed`, `inset-x-0`, `bottom-0`, `mx-auto`, `max-w-[520px]`, `max-h-…`, `h-[…dvh]`, `rounded-t-3xl`, `px-…`, `pb-…`, `pt-…`, `overflow-y-auto`, `outline-none`) vão no 2º argumento.
2. O resto (`sheet`, `z-50`/`z-60`, `bg-chat-bg`, `flex`, `flex-col`, `overflow-hidden`) vai no 3º.
3. Alça de arrastar (`Drawer.Handle` ou a barrinha `div` do topo) ganha `md:hidden`.
4. `NewAppointmentSheet.tsx:211` tem uma classe condicional (`… ? … : "sheet fixed …"`): troque só o ramo da folha por `sheetClass(side, …)` e deixe o outro ramo igual.
5. `ClientRow.tsx` tem 3 folhas: um `const side = useSheetSide()` por componente que renderiza `Drawer.Root` (respeite a regra dos hooks).
6. Se algum arquivo não usar `Drawer` do vaul, pule e anote no commit.

- [ ] **Step 6: Verificar**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: verde.

No dev logado: em 1440 px abra "Novo agendamento", a ficha de uma cliente, "Nova despesa" e a conversa. Cada uma abre à direita com 440 px e altura toda, fecha no "Fechar" e no Esc, e a tela de trás continua visível. Em 390 px as mesmas folhas sobem de baixo como antes.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/AdaptiveSheet.tsx tests/unit/adaptive-sheet.test.tsx src/features src/components/ui/LetterPicker.tsx
git commit -m "Desktop: folhas abrem como painel lateral no tablet e no desktop"
```

---

### Task 7: Hover e cursor só com mouse

Cobre o achado 11.

**Files:**
- Modify: `src/app/globals.css` (bloco novo no fim)

Sem teste unitário (CSS). Verificação no navegador.

- [ ] **Step 1: Adicionar o bloco**

```css
/* Hover só quando há mouse: no toque o estado grudaria depois do toque. */
@media (hover: hover) and (pointer: fine) {
  a[href],
  button:not(:disabled),
  [role="button"],
  summary,
  label[for] {
    cursor: pointer;
  }
  .sidenav-link:not([aria-current="page"]):hover {
    background: color-mix(in srgb, var(--fg) 5%, transparent);
  }
  .sidenav-new:hover {
    background: color-mix(in srgb, var(--primary) 88%, var(--fg));
  }
  .btn-tint:hover,
  .btn-glass:hover {
    filter: brightness(0.97);
  }
}
```

- [ ] **Step 2: Verificar**

No dev em 1440 px: passar o mouse nos itens do menu escurece o fundo, o cursor vira mãozinha em botões e links. No DevTools com emulação de iPhone (toque), nada muda.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "Desktop: hover e cursor só com mouse"
```

---

### Task 8: Atalhos de teclado

Cobre o achado 12 (N, /, ← →, T no Painel; D/S/M ficam com a visão Semana, fora deste plano).

**Files:**
- Create: `src/lib/shortcuts.ts`, `src/components/nav/Shortcuts.tsx`
- Modify: `src/app/(app)/layout.tsx` (monta `<Shortcuts />`), `src/features/clients/ClientSearch.tsx:36` (`data-search` no `<input>`)
- Test: `tests/unit/shortcuts.test.ts`

**Interfaces:**
- Consumes: `openNewAppointment()`; `todayStr()` e `isDateStr()` de `@/lib/dates` (já usados em `agenda/page.tsx`).
- Produces: `type Shortcut = "novo" | "buscar" | "hoje" | "anterior" | "proximo"`, `shortcutFor(e: KeyInfo): Shortcut | null`, `shiftDay(date: string, delta: number): string`, componente `Shortcuts()`. Qualquer campo com `data-search` recebe o foco no "/".

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/shortcuts.test.ts
import { describe, expect, it } from "vitest";
import { shiftDay, shortcutFor } from "@/lib/shortcuts";

const key = (k: string, extra: Partial<Parameters<typeof shortcutFor>[0]> = {}) =>
  shortcutFor({ key: k, ctrlKey: false, metaKey: false, altKey: false, target: document.body, ...extra });

describe("shortcutFor", () => {
  it.each([
    ["n", "novo"],
    ["N", "novo"],
    ["/", "buscar"],
    ["t", "hoje"],
    ["ArrowLeft", "anterior"],
    ["ArrowRight", "proximo"],
    ["x", null],
  ])("%s → %s", (k, expected) => {
    expect(key(k)).toBe(expected);
  });

  it("não dispara com Ctrl, Cmd ou Alt", () => {
    expect(key("n", { ctrlKey: true })).toBeNull();
    expect(key("n", { metaKey: true })).toBeNull();
    expect(key("n", { altKey: true })).toBeNull();
  });

  it("não dispara enquanto a pessoa digita", () => {
    expect(key("n", { target: document.createElement("input") })).toBeNull();
    expect(key("/", { target: document.createElement("textarea") })).toBeNull();
  });
});

describe("shiftDay", () => {
  it("anda um dia, virando mês e ano", () => {
    expect(shiftDay("2026-11-13", 1)).toBe("2026-11-14");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/shortcuts.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/shortcuts"".

- [ ] **Step 3: Implementar `src/lib/shortcuts.ts`**

```ts
// src/lib/shortcuts.ts
export type Shortcut = "novo" | "buscar" | "hoje" | "anterior" | "proximo";

type KeyInfo = { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; target: EventTarget | null };

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Tecla → atalho. Nada acontece com Ctrl/Cmd/Alt (atalhos do navegador) nem enquanto a pessoa digita. */
export function shortcutFor(e: KeyInfo): Shortcut | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const el = e.target instanceof HTMLElement ? e.target : null;
  if (el && (TYPING.has(el.tagName) || el.isContentEditable)) return null;
  switch (e.key) {
    case "n":
    case "N":
      return "novo";
    case "/":
      return "buscar";
    case "t":
    case "T":
      return "hoje";
    case "ArrowLeft":
      return "anterior";
    case "ArrowRight":
      return "proximo";
    default:
      return null;
  }
}

/** Dia vizinho no formato AAAA-MM-DD (o mesmo do ?d= do Painel), em UTC para não sofrer com horário de verão. */
export function shiftDay(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/shortcuts.test.ts`
Expected: PASS (10 testes).

- [ ] **Step 5: Implementar `Shortcuts.tsx` e montar**

```tsx
// src/components/nav/Shortcuts.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { openNewAppointment } from "@/features/appointments/QuickBook";
import { isDateStr, todayStr } from "@/lib/dates";
import { shiftDay, shortcutFor } from "@/lib/shortcuts";

/** Atalhos das pranchas: N novo agendamento, / busca, ← → dia anterior/seguinte e T hoje no Painel. */
export function Shortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = shortcutFor(e);
      if (!s) return;
      // Com folha ou diálogo aberto, as teclas são dele
      if (document.querySelector("dialog[open], [data-vaul-drawer][data-state='open']")) return;
      if (s === "novo") {
        e.preventDefault();
        openNewAppointment();
        return;
      }
      if (s === "buscar") {
        const box = document.querySelector<HTMLElement>("[data-search]");
        if (box) {
          e.preventDefault();
          box.focus();
        }
        return;
      }
      if (pathname !== "/agenda") return;
      e.preventDefault();
      const today = todayStr();
      const d = params.get("d");
      const current = d && isDateStr(d) ? d : today;
      const next = s === "hoje" ? today : shiftDay(current, s === "anterior" ? -1 : 1);
      router.push(next === today ? "/agenda" : `/agenda?d=${next}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, params]);

  return null;
}
```

Em `src/app/(app)/layout.tsx`, importe `import { Shortcuts } from "@/components/nav/Shortcuts";` e adicione logo depois de `<NavHistory />`:

```tsx
      <Suspense fallback={null}>
        <Shortcuts />
      </Suspense>
```

(`useSearchParams` precisa de `Suspense`.) Se `todayStr` ou `isDateStr` importarem algo só de servidor, o build quebra no passo 6: nesse caso copie as duas funções para `src/lib/shortcuts.ts` com teste.

Em `src/features/clients/ClientSearch.tsx`, no `<input` da linha 36, adicione o atributo `data-search`.

- [ ] **Step 6: Verificar**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: verde.

No dev logado em 1440 px: N abre "Novo agendamento"; em Clientes, / põe o foco na busca; no Painel, → vai para amanhã (`?d=`), ← volta, T volta para hoje; digitando na busca, N escreve "n".

- [ ] **Step 7: Commit**

```bash
git add src/lib/shortcuts.ts src/components/nav/Shortcuts.tsx "src/app/(app)/layout.tsx" src/features/clients/ClientSearch.tsx tests/unit/shortcuts.test.ts
git commit -m "Desktop: atalhos de teclado (N, /, setas e T)"
```

---

### Task 9: Tour aponta para o menu visível

Cobre o achado 29.

**Files:**
- Modify: `src/features/tour/steps.ts:41`, `src/features/tour/Tour.tsx:21`, `:55`, `:81`

**Interfaces:**
- Consumes: `data-tour="sidenav"` (Task 4).

- [ ] **Step 1: Alvo do passo da navegação**

Em `steps.ts:41`, troque `target: ".tabbar",` por `target: '.tabbar, [data-tour="sidenav"]',`. Se o texto desse passo disser "embaixo" ou "barra", troque por "menu" (o mesmo texto serve para os dois).

- [ ] **Step 2: `Tour.tsx` usa só o que está visível**

Logo abaixo dos imports de `Tour.tsx`, adicione:

```ts
/** No desktop a barra do rodapé existe no DOM mas está escondida: o tour olha só o que aparece. */
const firstVisible = (selector: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.getClientRects().length > 0) ?? null;
```

- Linha 21: `const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());` passa a terminar com `.filter((r) => r.width > 0 && r.height > 0);`.
- Linhas 55 e 81: troque `document.querySelector(…)` por `firstVisible(…)` com o mesmo argumento.

- [ ] **Step 3: Verificar**

Run: `pnpm test tests/unit/tour.test.ts && pnpm typecheck`
Expected: PASS.

No dev logado, em Ajustes toque em "Rever o tour" (`ReplayTourButton`) em 1440 px: o passo da navegação destaca o menu lateral. Em 390 px destaca a barra do rodapé como antes.

- [ ] **Step 4: Commit**

```bash
git add src/features/tour/steps.ts src/features/tour/Tour.tsx
git commit -m "Desktop: tour destaca o menu lateral"
```

---

### Task 10: e2e em iPad paisagem e desktop

Cobre o achado 30 e confere as Tasks 4 a 8 de ponta a ponta.

**Files:**
- Modify: `playwright.config.ts`
- Create: `tests/e2e/largura.spec.ts`

- [ ] **Step 1: Projetos novos no Playwright**

Em `playwright.config.ts`, troque o array `projects` por:

```ts
  projects: [
    {
      name: "iphone-15",
      // Os specs do celular continuam só aqui; os de tela larga rodam nos dois projetos abaixo
      testIgnore: /largura\.spec\.ts/,
      use: {
        ...iphone,
        browserName: "chromium",
        // Local: PW_CHROMIUM_PATH aponta para um Chromium já instalado. No CI usa o do `playwright install`.
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
    {
      name: "ipad-paisagem",
      testMatch: /largura\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
    {
      name: "desktop",
      testMatch: /largura\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
  ],
```

- [ ] **Step 2: Spec de tela larga**

```ts
// tests/e2e/largura.spec.ts
import { expect, test } from "./fixtures";

test("menu lateral no lugar da barra do rodapé", async ({ page }) => {
  await page.goto("/agenda");
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await expect(nav).toBeVisible();
  await expect(page.locator(".tabbar")).toBeHidden();
  await expect(nav.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Vagas" }).click();
  await expect(page).toHaveURL(/\/vagas$/);
  await expect(nav.getByRole("link", { name: "Vagas" })).toHaveAttribute("aria-current", "page");
});

test("a coluna não fica presa nos 520 px do celular", async ({ page }) => {
  await page.goto("/ajustes");
  const box = await page.locator("main").first().boundingBox();
  expect(box!.width).toBeGreaterThan(600);
});

test("N abre o novo agendamento como painel lateral, e Fechar fecha", async ({ page }) => {
  await page.goto("/agenda");
  await page.keyboard.press("n");
  const sheet = page.getByRole("dialog").last();
  await expect(sheet).toBeVisible();
  const vp = page.viewportSize()!;
  const box = (await sheet.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(vp.width - 2);
  expect(box.height).toBeGreaterThan(vp.height - 2);
  await sheet.getByRole("button", { name: "Fechar" }).click();
  await expect(sheet).toBeHidden();
});

test("alvos do menu têm pelo menos 44 px", async ({ page }) => {
  await page.goto("/agenda");
  const links = page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link");
  for (const link of await links.all()) {
    const b = (await link.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});
```

- [ ] **Step 3: Verificar**

Run (Fernando, com `.env.local`): `pnpm test:e2e`
Expected: os specs atuais passam no "iphone-15" e os 4 de `largura.spec.ts` passam em "ipad-paisagem" e "desktop" (8 execuções).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/largura.spec.ts
git commit -m "Desktop: e2e em iPad paisagem e desktop"
```

---

# Fase 2 · Telas em duas colunas

Cada tarefa liga `wide` no `PageShell` da tela e acrescenta classes `md:`/`lg:`/`xl:`. Verificação de todas: `pnpm typecheck && pnpm lint && pnpm test`, depois a tela no dev logado em 390, 1024 e 1440 px (em 390 nada muda).

### Task 11: Painel com "Contexto do dia" ao lado

Cobre o achado 15 (a parte que usa o que já existe: o balão da Bolha).

**Files:**
- Modify: `src/app/(app)/agenda/page.tsx`
- Modify: `tests/e2e/largura.spec.ts` (1 teste a mais)

- [ ] **Step 1: Escrever o teste e2e que falha**

Acrescente em `tests/e2e/largura.spec.ts`:

```ts
test("Painel: Contexto do dia fica à direita da agenda", async ({ page }) => {
  await page.goto("/agenda");
  const aside = page.getByRole("complementary", { name: "Contexto do dia" });
  await expect(aside).toBeVisible();
  const main = page.getByRole("navigation", { name: "Dias da semana" });
  expect((await aside.boundingBox())!.x).toBeGreaterThan((await main.boundingBox())!.x);
});
```

- [ ] **Step 2: Novo JSX do Painel**

Troque o `return` de `PainelPage` por:

```tsx
  return (
    <PageShell wide title={greeting(new Date(), userName)} subtitle={label.charAt(0).toUpperCase() + label.slice(1)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* No celular a Bolha vem antes da agenda; na tela larga ela vai para a coluna da direita */}
        <aside aria-label="Contexto do dia" className="lg:sticky lg:top-7 lg:order-2">
          <DayBubble briefing={dayBriefing(rows, new Date(), date === today)} isToday={date === today} />
        </aside>
        <div className="min-w-0 lg:order-1">
          <DaySchedule tenantId={tenantId} date={date} withStrip base="/agenda" />
        </div>
      </div>
    </PageShell>
  );
```

- [ ] **Step 3: Verificar e commit**

Run: `pnpm typecheck && pnpm lint && pnpm test`. Fernando: `pnpm test:e2e`.

```bash
git add "src/app/(app)/agenda/page.tsx" tests/e2e/largura.spec.ts
git commit -m "Desktop: Painel com Contexto do dia ao lado"
```

### Task 12: Finanças com indicadores lado a lado

Cobre o achado 18.

**Files:**
- Modify: `src/app/(app)/financeiro/page.tsx`

- [ ] **Step 1: Classes novas**

1. `<PageShell title="Financeiro" subtitle={label}>` vira `<PageShell wide title="Financeiro" subtitle={label}>`.
2. No `<nav aria-label="Mês" …>`, acrescente `md:max-w-md` ao fim da template string.
3. No `<div className="grid gap-4…">` logo abaixo, acrescente `lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6`.
4. `<section aria-label="Resumo" className={card}>` vira `className={`${card} lg:col-span-2`}`, e o `<dl className="grid grid-cols-2 …">` dentro dela ganha `md:grid-cols-4`.
5. `<section aria-labelledby="por-servico" …>` ganha `lg:col-start-2 lg:row-start-2` (rosca na coluna de 380 px).
6. `<section aria-labelledby="por-categoria" …>` e as seções que vêm depois dela no mesmo grid ganham `lg:col-start-1`.

- [ ] **Step 2: Verificar e commit**

Em 1440 px: os 4 números do resumo numa linha, rosca à direita, despesas à esquerda.

```bash
git add "src/app/(app)/financeiro/page.tsx"
git commit -m "Desktop: Finanças com indicadores lado a lado"
```

### Task 13: Vagas e Pendências em colunas

Cobre os achados 20 e 21.

**Files:**
- Modify: `src/app/(app)/vagas/page.tsx`, `src/app/(app)/pendencias/page.tsx`

- [ ] **Step 1: Vagas**

1. Os dois `<PageShell title="Vagas" …>` ganham `wide`.
2. O `<div className="grid gap-3…">` (linha ~60 do `return`) ganha `md:grid-cols-2 xl:grid-cols-3 md:items-start`.
3. O `<ShareSheet … />` dentro desse grid vai para dentro de `<div className="md:col-span-full">…</div>`, para o "Copiar texto para divulgar" ocupar a linha toda.

- [ ] **Step 2: Pendências**

1. `<PageShell back title="Pendências" …>` ganha `wide`.
2. O `<div className="grid gap-5…">` ganha `lg:grid-cols-2 lg:items-start`.

- [ ] **Step 3: Verificar e commit**

Em 1440 px: horários livres em 3 colunas com o texto de divulgar em cima; pendências em 2 colunas.

```bash
git add "src/app/(app)/vagas/page.tsx" "src/app/(app)/pendencias/page.tsx"
git commit -m "Desktop: Vagas e Pendências em colunas"
```

### Task 14: Clientes e Meu perfil em colunas

Cobre os achados 17 (lista larga; a ficha já abre ao lado pela Task 6) e 23.

**Files:**
- Modify: `src/app/(app)/clientes/page.tsx`, `src/app/(app)/perfil/page.tsx`

- [ ] **Step 1: Clientes**

1. `<PageShell title="Clientes">` vira `<PageShell wide title="Clientes">`.
2. O `<div className="grid grid-cols-2 gap-2 pb-3…">` (Importar e Nova cliente) ganha `md:max-w-md`.
3. O `<div className="grid gap-3…">` da lista ganha `lg:grid-cols-2 xl:grid-cols-3 lg:items-start`.

- [ ] **Step 2: Meu perfil**

1. `<PageShell back title="Meu perfil">` vira `<PageShell back wide title="Meu perfil">`.
2. O `<div className="grid gap-6…">` ganha `lg:grid-cols-2 lg:items-start`.

- [ ] **Step 3: Verificar e commit**

Em 1440 px: clientes em 3 colunas, a ficha abre à direita; Meu perfil com mascote à esquerda e dados do salão à direita.

```bash
git add "src/app/(app)/clientes/page.tsx" "src/app/(app)/perfil/page.tsx"
git commit -m "Desktop: Clientes e Meu perfil em colunas"
```

### Task 15: Ajustes com índice de seções

Cobre o achado 22 (o índice; os cartões em 2 colunas ficam para depois, porque os formulários de mensagens são longos).

**Files:**
- Modify: `src/app/(app)/ajustes/page.tsx`

- [ ] **Step 1: Índice ao lado**

1. `<PageShell title="Ajustes">` vira `<PageShell wide title="Ajustes">`.
2. No `<Group title="Este aparelho">`, a primeira `<section>` ganha `id="este-aparelho"` e a classe `scroll-mt-6` (igual às outras).
3. Antes do `export default`, adicione:

```tsx
const SECOES = [
  { id: "whatsapp", label: "Conexões" },
  { id: "avisos-do-dia", label: "Avisos do dia" },
  { id: "mensagens", label: "Mensagens para a cliente" },
  { id: "expediente", label: "Agenda" },
  { id: "este-aparelho", label: "Este aparelho" },
] as const;
```

4. Envolva todos os `<Group …>` do `return` assim:

```tsx
    <PageShell wide title="Ajustes">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <nav aria-label="Seções de Ajustes" className="hidden lg:sticky lg:top-7 lg:grid lg:gap-1">
          {SECOES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex min-h-11 items-center rounded-[14px] px-3 font-semibold text-muted focus-visible:outline-2 focus-visible:outline-primary"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="min-w-0 max-w-[720px]">
          {/* os <Group> de hoje, sem mudança */}
        </div>
      </div>
    </PageShell>
```

- [ ] **Step 2: Verificar e commit**

Em 1440 px: índice fixo à esquerda; clicar em "Mensagens para a cliente" rola até a seção. Em 1024 px o índice aparece; em 768 px some.

```bash
git add "src/app/(app)/ajustes/page.tsx"
git commit -m "Desktop: Ajustes com índice de seções"
```

---

## Fora deste plano (Fase 3, planos próprios)

| Item | Achado | Por que fica fora |
|---|---|---|
| Visão Semana do Calendário (grade de 7 dias, arrastar entre dias, D/S/M) | 16 | Recurso novo grande; precisa de desenho de dados por semana e gestos próprios |
| Cartões Previsão de ganho, Próximos e Pendências do dia na coluna do Painel | 15 | Componentes novos; falta o Fernando confirmar de onde saem os números (decisão 3 do levantamento) |
| Ficha de cliente em coluna fixa de 420 px com j/k e `?id=` | 17 | Muda o fluxo da ficha; o painel lateral da Task 6 já resolve o uso |
| Catálogo de Serviços em 3 colunas | 19 | O catálogo monta a lista dentro de `ServicesCatalog.tsx`; pede leitura própria |
| Login e Splash em duas metades com a Bolha | 24 | Fora do app logado; mexe na abertura com o mascote |
| Cursor de arrastar e dica "arraste para remarcar" na agenda | 13 | Acabamento; depende de marcar os blocos do `AgendaDay` |
| Cartões de Ajustes em 2 colunas e resumo de 360 px em Pendências | 21, 22 | Acabamento depois de ver as telas largas prontas |
