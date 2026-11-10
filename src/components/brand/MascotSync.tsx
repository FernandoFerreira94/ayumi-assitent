"use client";

import { useEffect } from "react";
import { applyMascot } from "./applyMascot";
import type { MascotKind } from "./mascots";

/**
 * Alinha o tema do aparelho com o salvo no servidor (outro aparelho). persist=false só mostra, sem guardar:
 * o login usa assim para ficar sempre com a Bolha.
 */
export function MascotSync({ value, persist = true }: { value: MascotKind; persist?: boolean }) {
  useEffect(() => applyMascot(value, persist), [value, persist]);
  return null;
}
