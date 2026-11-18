import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StepGuide } from "@/components/ui/StepGuide";
import { pairingSteps } from "@/features/whatsapp/pairing-guide";
import { ICLOUD_STEPS } from "@/features/calendar-feed/icloud-guide";

const steps = [
  { art: <svg />, text: "Abra o app" },
  { art: <svg />, text: "Toque em Calendários" },
  { art: <svg />, text: "Copie o link" },
];

describe("StepGuide", () => {
  it("mostra o texto de cada passo e anda pelos botões", async () => {
    render(<StepGuide steps={steps} label="Como fazer" />);
    expect(screen.getByRole("region", { name: "Como fazer" })).toBeTruthy();
    expect(screen.getByText("Abra o app")).toBeTruthy();
    expect(screen.getByText("Passo 1 de 3")).toBeTruthy();

    const prev = screen.getByRole("button", { name: "Passo anterior" });
    const next = screen.getByRole("button", { name: "Próximo passo" });
    expect(prev).toHaveProperty("disabled", true);

    await userEvent.click(next);
    await userEvent.click(next);
    expect(screen.getByText("Passo 3 de 3")).toBeTruthy();
    expect(next).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Ir para o passo 3" }).getAttribute("aria-current")).toBe("step");

    await userEvent.click(screen.getByRole("button", { name: "Ir para o passo 1" }));
    expect(screen.getByText("Passo 1 de 3")).toBeTruthy();
  });

  it("ilustração fica fora do leitor de tela; o texto é a descrição", () => {
    const { container } = render(<StepGuide steps={pairingSteps("ABCD1234")} label="WhatsApp" />);
    for (const svg of container.querySelectorAll("svg[viewBox='0 0 320 190']")) {
      expect(svg.closest("[aria-hidden='true']")).not.toBeNull();
    }
    expect(screen.getByText(/Conectar um aparelho/, { selector: "b" })).toBeTruthy();
  });

  it("guias reais têm 3 passos com texto", () => {
    expect(pairingSteps("")).toHaveLength(3);
    expect(ICLOUD_STEPS).toHaveLength(3);
  });
});
