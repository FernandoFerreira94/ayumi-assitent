"use client";

import { isNativeShell } from "@/features/install/platform";

export type HapticKind = "success" | "warning" | "error" | "light";

/** Vibração curta no app da loja (resultado de uma ação). No navegador não faz nada nem carrega o plugin. */
export function haptic(kind: HapticKind): void {
  if (typeof navigator === "undefined" || !isNativeShell(navigator.userAgent)) return;
  void (async () => {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isPluginAvailable("Haptics")) return;
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (kind === "light") await Haptics.impact({ style: ImpactStyle.Light });
    else
      await Haptics.notification({
        type:
          kind === "success"
            ? NotificationType.Success
            : kind === "warning"
              ? NotificationType.Warning
              : NotificationType.Error,
      });
  })().catch(() => {});
}
