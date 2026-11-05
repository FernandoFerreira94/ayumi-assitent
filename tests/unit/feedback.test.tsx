import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

afterEach(() => vi.useRealTimers());

describe("ErrorState", () => {
  it("anuncia o erro e oferece tentar de novo", async () => {
    const retry = vi.fn();
    render(<ErrorState onRetry={retry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Voltar para a agenda" })).toHaveAttribute("href", "/agenda");
  });
});

describe("EmptyState", () => {
  it("mostra título, descrição e ação", () => {
    render(
      <EmptyState
        title="Nenhuma cliente ainda"
        description="Cadastre a primeira."
        action={<button>Cadastrar</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Nenhuma cliente ainda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
  });
});

describe("SubmitButton", () => {
  it("fica bloqueado e mostra o verbo em andamento", () => {
    render(
      <SubmitButton pending pendingLabel="Salvando…">
        Salvar
      </SubmitButton>,
    );
    const btn = screen.getByRole("button", { name: "Salvando…" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });
  it("avisa quando demora mais de 8 s", () => {
    vi.useFakeTimers();
    render(
      <SubmitButton pending pendingLabel="Enviando…">
        Enviar
      </SubmitButton>,
    );
    expect(screen.queryByText(/demorando/)).toBeNull();
    act(() => void vi.advanceTimersByTime(8100));
    expect(screen.getByText("Está demorando mais que o normal…")).toBeInTheDocument();
  });
  it("mostra o texto normal quando livre", () => {
    render(
      <SubmitButton pending={false} pendingLabel="Salvando…">
        Salvar
      </SubmitButton>,
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });
});

describe("Skeleton", () => {
  it("fica escondido de leitores de tela e a região anuncia o carregamento", () => {
    render(
      <LoadingRegion label="Carregando a agenda">
        <Skeleton className="h-4" />
      </LoadingRegion>,
    );
    expect(screen.getByRole("status", { name: "Carregando a agenda" })).toHaveAttribute("aria-busy", "true");
  });
});
