import type { Metadata } from "next";

/**
 * Prévia do link ao compartilhar (WhatsApp, Instagram, iMessage): Open Graph + Twitter.
 * A imagem fica em /public/og.png (1200x630, < 300 KB) e é pública no proxy.
 * Trocou a imagem? Suba o ?v= — o WhatsApp guarda a prévia em cache por URL.
 */
export const SITE_NAME = "bubbly";
export const SHARE_DESCRIPTION = "Agenda, clientes e lembretes do seu estúdio, com confirmações automáticas no WhatsApp.";

const SHARE_IMAGE = { url: "/og.png?v=1", width: 1200, height: 630, alt: "bubbly: agenda do seu estúdio", type: "image/png" };

/** URL pública do app: as tags precisam de endereço absoluto. */
export function siteUrl(env = process.env): URL {
  const raw =
    env.BETTER_AUTH_URL ?? (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000");
  return new URL(raw);
}

/** Open Graph + Twitter de uma página. O Next não mescla openGraph entre layout e página: cada página manda o seu. */
export function shareMeta(title: string, description = SHARE_DESCRIPTION, path = "/"): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}
