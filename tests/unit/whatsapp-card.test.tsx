import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppCard } from "@/features/whatsapp/WhatsAppCard";
import { startWhatsappPairing, whatsappStatus } from "@/features/whatsapp/actions";

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

  it("passo a passo troca entre iPhone e Android", async () => {
    vi.mocked(startWhatsappPairing).mockResolvedValue({
      ok: true,
      data: { pairingCode: "ABCD1234", qr: null },
    } as never);
    vi.mocked(whatsappStatus).mockResolvedValue({ ok: true, data: { state: "connecting" } } as never);
    render(<WhatsAppCard initial="other" profilePhone="(11) 98765-4321" />);
    await ligar();
    await userEvent.click(screen.getByRole("button", { name: "Gerar código de conexão" }));

    // jsdom não é Android: começa no iPhone
    expect(screen.getByRole("radio", { name: "iPhone" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Aparelhos conectados", { selector: "b" })).toBeTruthy();

    await userEvent.click(screen.getByRole("radio", { name: "Android" }));
    expect(screen.getByRole("radio", { name: "Android" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Dispositivos conectados", { selector: "b" })).toBeTruthy();
    expect(screen.queryByText("Aparelhos conectados", { selector: "b" })).toBeNull();
  });
});
