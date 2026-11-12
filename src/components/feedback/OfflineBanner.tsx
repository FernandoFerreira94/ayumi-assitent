"use client";

import { useSyncExternalStore } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { FEEDBACK_MOOD } from "@/components/brand/moods";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-wait-bg px-4 py-2 text-sm font-bold text-wait"
    >
      <Mascot mood={FEEDBACK_MOOD.warning} size={26} />
      Você está sem internet. Mostrando o que foi salvo.
    </div>
  );
}
