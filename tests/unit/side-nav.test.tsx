// tests/unit/side-nav.test.tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { openNewAppointment } = vi.hoisted(() => ({ openNewAppointment: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/clientes/42" }));
vi.mock("@/features/appointments/QuickBook", () => ({ openNewAppointment }));

import { SideNav } from "@/components/nav/SideNav";

describe("SideNav", () => {
  it("lista as 10 telas, marca a atual e mostra a contagem de pendências", () => {
    render(<SideNav studioName="Estúdio Lua" pendencias={3} />);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Painel" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Pendências 3" })).toHaveAttribute("href", "/pendencias");
    expect(within(nav).getByRole("link", { name: /Estúdio Lua.*Perfil e conta/ })).toHaveAttribute("href", "/perfil");
    // topo (mascote, leva ao Painel) + 10 telas + perfil
    expect(within(nav).getByRole("link", { name: /Bubbly, início/ })).toHaveAttribute("href", "/agenda");
    expect(within(nav).getAllByRole("link")).toHaveLength(12);
  });

  it("mostra o nome de quem está logado embaixo de bubbly; sem nome, nada", () => {
    const { unmount } = render(<SideNav studioName="Estúdio Lua" userName="Yumi Tanaka" pendencias={0} />);
    expect(screen.getByText("Yumi Tanaka")).toBeInTheDocument();
    unmount();
    const { container } = render(<SideNav studioName="Estúdio Lua" userName="  " pendencias={0} />);
    expect(container.querySelector(".sidenav-person")).toBeNull();
  });

  it("Novo agendamento abre a folha global", () => {
    render(<SideNav studioName={null} pendencias={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo agendamento" }));
    expect(openNewAppointment).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Pendências" })).toBeInTheDocument();
  });

  it("atalho do Admin só para quem o servidor marcou como admin", () => {
    const { unmount } = render(<SideNav studioName={null} pendencias={0} />);
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    unmount();
    render(<SideNav studioName={null} pendencias={0} isAdmin />);
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
  });
});
