import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { passwordPairState } from "@/lib/password";

vi.mock("@/features/google/actions", () => ({ createPassword: vi.fn() }));
vi.mock("@/components/ui/AdaptiveSheet", () => ({
  SidePanelClose: () => null,
  sheetClass: (_s: string, m: string) => m,
  useSheetSide: () => "bottom",
}));

const { CreatePasswordSheet } = await import("@/features/google/CreatePasswordSheet");

describe("passwordPairState", () => {
  it("sem repetir ainda não acusa nada", () => {
    expect(passwordPairState("senha-boa-1", "")).toBe("idle");
  });
  it("diferentes, iguais curtas e iguais válidas", () => {
    expect(passwordPairState("senha-boa-1", "senha-boa")).toBe("mismatch");
    expect(passwordPairState("curta", "curta")).toBe("short");
    expect(passwordPairState("senha-boa-1", "senha-boa-1")).toBe("ok");
  });
});

describe("CreatePasswordSheet", () => {
  it("só libera Criar senha quando as duas senhas batem, com aviso vermelho e verde", () => {
    // fireEvent em vez de userEvent: o Drawer (vaul) usa pointer capture, que o jsdom não tem.
    render(<CreatePasswordSheet open onOpenChange={() => {}} onCreated={() => {}} email="a@b.com" />);
    const button = screen.getByRole("button", { name: "Criar senha" });
    const confirm = screen.getByLabelText("Repita a senha");
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "senha-boa-1" } });
    fireEvent.change(confirm, { target: { value: "senha-boa" } });
    expect(screen.getByText("As senhas não são iguais.")).toHaveClass("text-fail");
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(button).toBeDisabled();

    fireEvent.change(confirm, { target: { value: "senha-boa-1" } });
    expect(screen.getByText("As senhas são iguais.")).toHaveClass("text-ok");
    expect(confirm).toHaveAttribute("aria-invalid", "false");
    expect(button).toBeEnabled();
  });
});
