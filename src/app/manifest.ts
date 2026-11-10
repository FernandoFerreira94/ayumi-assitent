import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import { DEFAULT_MASCOT, isMascotKind, MASCOT_COOKIE, MASCOTS } from "@/components/brand/mascots";

/** Ícone e cor do mascote escolhido (cookie gravado em Meu perfil); a Bolha é o padrão. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const saved = (await cookies()).get(MASCOT_COOKIE)?.value;
  const kind = isMascotKind(saved) ? saved : DEFAULT_MASCOT;
  const dir = kind === DEFAULT_MASCOT ? "/icons" : `/icons/${kind}`;
  return {
    name: "mimo",
    short_name: "mimo",
    description: "Agenda, clientes e lembretes do seu estúdio.",
    start_url: "/agenda",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F7FC",
    theme_color: MASCOTS.find((m) => m.id === kind)?.primary ?? "#6D4AFF",
    lang: "pt-BR",
    icons: [
      { src: `${dir}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${dir}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${dir}/icon-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
