// tests/unit/app-menu.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/agenda",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/brand/Mascot", () => ({ Mascot: () => null }));
vi.mock("@/components/nav/SignOutButton", () => ({ SignOutButton: () => null }));

import { AppMenu } from "@/components/nav/AppMenu";

const base = { userName: "Yumi", studioName: "Estúdio", whatsapp: "open" as const, pendencias: 0, version: "1.0.0" };

describe("AppMenu", () => {
  it("não mostra o Admin para quem não é admin", () => {
    render(<AppMenu {...base} />);
    expect(screen.getByRole("link", { name: "Ajustes", hidden: true })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin", hidden: true })).not.toBeInTheDocument();
  });

  it("mostra o Admin para o dono", () => {
    render(<AppMenu {...base} isAdmin />);
    expect(screen.getByRole("link", { name: "Admin", hidden: true })).toHaveAttribute("href", "/admin");
  });
});
