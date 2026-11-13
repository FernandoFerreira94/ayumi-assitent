import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_VERSION, SEEN_VERSION_KEY } from "@/features/update/changelog";
import { WhatsNewDialog } from "@/features/update/WhatsNewDialog";

vi.mock("next/navigation", () => ({ usePathname: () => "/agenda" }));

// jsdom não implementa o modal nativo: simula open/showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(HTMLDialogElement.prototype.showModal).mockClear();
});

function dialog() {
  return document.querySelector("dialog")!;
}

async function openDialog() {
  render(<WhatsNewDialog enabled />);
  await screen.findByRole("heading", { name: "App atualizado" });
  expect(dialog().open).toBe(true);
}

describe("WhatsNewDialog", () => {
  it("Entendi fecha e não reabre o fundo borrado", async () => {
    await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "Entendi" }));
    await act(async () => {});
    expect(dialog().open).toBe(false);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    expect(localStorage.getItem(SEEN_VERSION_KEY)).toBe(CURRENT_VERSION);
  });

  it("toque fora fecha e não reabre", async () => {
    await openDialog();
    await userEvent.click(dialog());
    await act(async () => {});
    expect(dialog().open).toBe(false);
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  });

  it("Esc (cancel) fecha e não reabre", async () => {
    await openDialog();
    act(() => {
      dialog().dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    await waitFor(() => expect(dialog().open).toBe(false));
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  });

  it("não abre quando a versão já foi vista", async () => {
    localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION);
    render(<WhatsNewDialog enabled />);
    await act(async () => {});
    expect(dialog().open).toBe(false);
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });
});
