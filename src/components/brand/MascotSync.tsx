"use client";

import { useEffect } from "react";
import { applyMascot } from "./applyMascot";
import type { MascotKind } from "./mascots";

/** Alinha o tema do aparelho com o salvo no servidor (outra pessoa da conta, outro aparelho). */
export function MascotSync({ value }: { value: MascotKind }) {
  useEffect(() => applyMascot(value), [value]);
  return null;
}
