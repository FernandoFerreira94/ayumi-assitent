"use client";

import { Icon } from "@/components/ui/Icon";
import { startTour } from "./Tour";

export function ReplayTourButton() {
  return (
    <button
      type="button"
      onClick={startTour}
      className="btn-glass inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold"
    >
      <Icon name="map" size={18} />
      Rever o tour do app
    </button>
  );
}
