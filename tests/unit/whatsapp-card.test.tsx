import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/whatsapp/actions", () => ({
  whatsappStatus: vi.fn(),
  startWhatsappPairing: vi.fn(),
  disconnectWhatsapp: vi.fn(),
}));

async function ligar() {
  await userEvent.click(screen.getByRole("switch", { name: "WhatsApp" }));
  return screen.getByRole("textbox", { name: "Número do WhatsApp do estúdio" }) as HTMLInputElement;
}

describe("WhatsAppCard", () => {
  it("traz o telefone do perfil no campo e deixa trocar", async () => {
    render(<WhatsAppCard initial="other" profilePhone="(11) 98765-4321" />);
    const input = await ligar();
    expect(input.value).toBe("(11) 98765-4321");
    expect(screen.getByText(/Número do seu perfil/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gerar código de conexão" })).toHaveProperty("disabled", false);

    await userEvent.clear(input);
    await userEvent.type(input, "21912345678");
    expect(input.value).toBe("(21) 91234-5678");
    expect(screen.queryByText(/Número do seu perfil/)).toBeNull();
  });

  it("sem telefone no perfil, campo vem vazio", async () => {
    render(<WhatsAppCard initial="other" />);
    const input = await ligar();
    expect(input.value).toBe("");
    expect(screen.queryByText(/Número do seu perfil/)).toBeNull();
  });
});
