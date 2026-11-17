import { Suspense } from "react";
import { getMenuData } from "./menu-data";
import { TabBar } from "./TabBar";

async function TabBarWithRole() {
  const { role } = await getMenuData();
  return <TabBar role={role} />;
}

/** A barra aparece na hora com todas as abas; o papel chega e tira as que a pessoa não abre. */
export function TabBarSlot() {
  return (
    <Suspense fallback={<TabBar />}>
      <TabBarWithRole />
    </Suspense>
  );
}
