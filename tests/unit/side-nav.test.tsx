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
