"use client";

import { useEffect, useState } from "react";
import { usePushState } from "@/features/push/use-push-state";
import { notificationsLine } from "./connection-status";
import { LOCATION_CHANGED } from "./live-events";
import type { SettingsLine } from "./summary";

/**
 * Completa as linhas que dependem deste aparelho (Notificação: push daqui + localização do salão).
 * A localização acompanha o interruptor na hora, pelo evento, sem esperar o servidor.
 */
export function useLiveLines(lines: SettingsLine[]): SettingsLine[] {
  const push = usePushState();
  const [location, setLocation] = useState<boolean | null>(null);
  useEffect(() => {
    const on = (e: Event) => setLocation((e as CustomEvent<boolean>).detail);
    window.addEventListener(LOCATION_CHANGED, on);
    return () => window.removeEventListener(LOCATION_CHANGED, on);
  }, []);
  return lines.map((l) => (l.push ? { ...l, ...notificationsLine(push, location ?? l.push.locationOn) } : l));
}
