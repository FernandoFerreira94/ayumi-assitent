"use client";

import { toast, Toaster, type ExternalToast } from "sonner";
import { Mascot, type MascotMood } from "@/components/brand/Mascot";
import { messageFor, type ErrorCode } from "@/lib/errors";

/** Os cinco tipos de toast do app. */
export type ToastKind = "success" | "error" | "warning" | "info" | "loading";

/**
 * Registro único: tipo do toast → expressão da Bolha. Para mudar o rosto de um tipo, é só aqui.
 * A Bolha segue o mascote e as cores escolhidos em Meu perfil (o rosto é o mesmo em todos).
 */
export const TOAST_MOOD: Record<ToastKind, MascotMood> = {
  success: "happy",
  error: "sad",
  warning: "alert",
  info: "neutral",
  loading: "thinking",
};

const icon = (kind: ToastKind) => <Mascot mood={TOAST_MOOD[kind]} size={34} />;

/** Toast no topo, abaixo da Dynamic Island, em vidro. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={{ top: "max(calc(env(safe-area-inset-top) + 8px), 20px)", left: 14, right: 14 }}
      mobileOffset={{ top: "max(calc(env(safe-area-inset-top) + 8px), 20px)", left: 14, right: 14 }}
      visibleToasts={3}
      // Rede de segurança: mesmo um toast chamado direto no sonner nunca mostra o ícone padrão dele
      icons={{
        success: icon("success"),
        error: icon("error"),
        warning: icon("warning"),
        info: icon("info"),
      }}
      toastOptions={{ unstyled: false, classNames: { toast: "app-toast" } }}
    />
  );
}

function show(kind: ToastKind, title: string, opts: ExternalToast = {}) {
  const fn = kind === "loading" ? toast.loading : toast[kind];
  return fn(title, { icon: icon(kind), ...opts });
}

/**
 * Único ponto de entrada para toasts (nada de `toast.*` do sonner nas telas, nem ícone solto).
 * Cada tipo traz a Bolha com a expressão certa.
 */
export const notify = {
  success: (title: string, description?: string, id?: string | number) => show("success", title, { description, id }),
  info: (title: string, description?: string) => show("info", title, { description }),
  /** Aviso: deu certo ou foi barrado, mas a pessoa precisa saber de algo (ex.: salvou sem ir ao Google). */
  warning: (title: string, description?: string) => show("warning", title, { description }),
  /** Em andamento. Devolve o id: passe-o como 3º argumento de success para virar o resultado. */
  loading: (title: string, description?: string) => show("loading", title, { description }),
  dismiss: (id?: string | number) => toast.dismiss(id),
  /** Convite com um botão de ação (ex.: instalar o app). */
  invite: (title: string, description: string, onAction: () => void) =>
    show("info", title, {
      description,
      duration: 9000,
      icon: icon("success"),
      action: { label: "Como instalar", onClick: onAction },
    }),
  error: (code: ErrorCode | undefined, retry?: () => void) =>
    show("error", messageFor(code), retry ? { action: { label: "Tentar de novo", onClick: retry } } : undefined),
  /** Falha explicada na hora, com texto próprio, sem código de erro do servidor. */
  problem: (title: string, description?: string) => show("error", title, { description }),
  /** Ação já feita, com Desfazer por 6 s. "warning" para o que a pessoa pode estranhar (cancelar, faltou). */
  undoable: (title: string, undo: () => void, description?: string, kind: "success" | "warning" = "success") =>
    show(kind, title, { description, duration: 6000, action: { label: "Desfazer", onClick: undo } }),
};
