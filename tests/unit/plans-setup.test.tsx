// tests/unit/plans-setup.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// As folhas reais puxam server actions; aqui só importa qual botão o aviso oferece
vi.mock("@/features/services/NewServiceSheet", () => ({
  NewServiceSheet: ({ label }: { label?: string }) => <button type="button">{label}</button>,
}));
vi.mock("@/features/clients/NewClientSheet", () => ({
  NewClientSheet: ({ label }: { label?: string }) => <button type="button">{label}</button>,
}));

import { PlansSetup } from "@/features/wallet/PlansSetup";

describe("PlansSetup", () => {
  it("sem serviço: pede o serviço e oferece cadastrar", () => {
    render(<PlansSetup missing="service" />);
    expect(screen.getByRole("region", { name: "Cadastre um serviço primeiro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar serviço" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar cliente" })).not.toBeInTheDocument();
  });

  it("sem cliente: pede a cliente e oferece cadastrar", () => {
    render(<PlansSetup missing="client" />);
    expect(screen.getByRole("region", { name: "Cadastre uma cliente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar cliente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar serviço" })).not.toBeInTheDocument();
  });
});
