"use client";

import { startTour } from "./Tour";

export function ReplayTourButton() {
  return (
    <button type="button" onClick={startTour} className="btn-glass min-h-12 w-full rounded-full px-5 text-sm font-bold">
      Rever o tour do app
    </button>
  );
}
