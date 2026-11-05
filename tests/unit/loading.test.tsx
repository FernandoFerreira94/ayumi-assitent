import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AgendaLoading from "@/app/(app)/agenda/loading";
import ClientesLoading from "@/app/(app)/clientes/loading";
import VagasLoading from "@/app/(app)/vagas/loading";
import AjustesLoading from "@/app/(app)/ajustes/loading";
import PendenciasLoading from "@/app/(app)/pendencias/loading";

describe("loading.tsx de cada aba", () => {
  it.each([
    [AgendaLoading, "Carregando a agenda"],
    [ClientesLoading, "Carregando clientes"],
    [VagasLoading, "Carregando vagas"],
    [AjustesLoading, "Carregando ajustes"],
    [PendenciasLoading, "Carregando pendências"],
  ])("anuncia estado de carregamento", (C, label) => {
    render(<C />);
    expect(screen.getByRole("status", { name: label })).toHaveAttribute("aria-busy", "true");
  });
});
