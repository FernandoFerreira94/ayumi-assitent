"use client";

import { toast, Toaster } from "sonner";
import { Mascot } from "@/components/brand/Mascot";
import { messageFor, type ErrorCode } from "@/lib/errors";

/** Toast no topo, abaixo da Dynamic Island, em vidro. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={{ top: "max(calc(env(safe-area-inset-top) + 8px), 20px)", left: 14, right: 14 }}
      mobileOffset={{ top: "max(calc(env(safe-area-inset-top) + 8px), 20px)", left: 14, right: 14 }}
      visibleToasts={3}
      toastOptions={{ unstyled: false, classNames: { toast: "app-toast" } }}
    />
  );
}

export const notify = {
  success: (title: string, description?: string) =>
    toast.success(title, { description, icon: <Mascot mood="happy" size={30} /> }),
  info: (title: string, description?: string) => toast.info(title, { description, icon: <Mascot size={30} /> }),
  /** Convite com um botão de ação (ex.: instalar o app). */
  invite: (title: string, description: string, onAction: () => void) =>
    toast.info(title, {
      description,
      duration: 9000,
      icon: <Mascot mood="happy" size={30} />,
      action: { label: "Como instalar", onClick: onAction },
    }),
  error: (code: ErrorCode | undefined, retry?: () => void) =>
    toast.error(messageFor(code), retry ? { action: { label: "Tentar de novo", onClick: retry } } : undefined),
  /** Recusa explicada na hora (ex.: soltar em cima de outro horário), sem código de erro do servidor. */
  problem: (title: string, description?: string) => toast.error(title, { description }),
  /** Ação destrutiva com Desfazer por 6 s. */
  undoable: (title: string, undo: () => void, description?: string) =>
    toast.warning(title, { description, duration: 6000, action: { label: "Desfazer", onClick: undo } }),
};
