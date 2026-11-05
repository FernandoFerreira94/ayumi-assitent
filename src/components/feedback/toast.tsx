"use client";

import { toast, Toaster } from "sonner";
import { messageFor, type ErrorCode } from "@/lib/errors";

/** Toast no topo, abaixo da Dynamic Island, em vidro. */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={{ top: 54, left: 14, right: 14 }}
      mobileOffset={{ top: 54, left: 14, right: 14 }}
      visibleToasts={3}
      toastOptions={{ unstyled: false, classNames: { toast: "app-toast" } }}
    />
  );
}

export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  info: (title: string, description?: string) => toast.info(title, { description }),
  error: (code: ErrorCode | undefined, retry?: () => void) =>
    toast.error(messageFor(code), retry ? { action: { label: "Tentar de novo", onClick: retry } } : undefined),
  /** Ação destrutiva com Desfazer por 6 s. */
  undoable: (title: string, undo: () => void, description?: string) =>
    toast.warning(title, { description, duration: 6000, action: { label: "Desfazer", onClick: undo } }),
};
