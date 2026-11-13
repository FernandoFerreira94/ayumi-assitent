import { Suspense } from "react";
// Default import: o bundler só garante o export default de JSON
import pkg from "../../../package.json";
import { AppMenu } from "./AppMenu";
import { getMenuData } from "./menu-data";

async function MenuWithData() {
  const m = await getMenuData();
  return (
    <AppMenu
      userName={m.userName}
      studioName={m.studioName}
      whatsapp={m.whatsapp}
      pendencias={m.pendencias}
      version={pkg.version}
    />
  );
}

export function HeaderMenu() {
  return (
    <Suspense fallback={<span aria-hidden="true" className="avatar size-11 shrink-0 rounded-full opacity-60" />}>
      <MenuWithData />
    </Suspense>
  );
}
