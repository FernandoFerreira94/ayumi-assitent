// src/components/nav/SideNavSlot.tsx
import { Suspense } from "react";
import { getMenuData } from "./menu-data";
import { SideNav } from "./SideNav";

async function SideNavWithData() {
  const m = await getMenuData();
  return <SideNav studioName={m.studioName} pendencias={m.pendencias} />;
}

/** Reserva a largura do menu enquanto os dados chegam, para o conteúdo não pular de lado. */
export function SideNavSlot() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="sidenav-placeholder" />}>
      <SideNavWithData />
    </Suspense>
  );
}
