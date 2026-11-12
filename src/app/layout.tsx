import type { Metadata, Viewport } from "next";
import { Quicksand, Nunito } from "next/font/google";
import { mascotGate } from "@/components/brand/mascots";
import { Splash, splashGate } from "@/components/brand/Splash";
import { UpdateBanner } from "@/components/nav/UpdateBanner";
import { AppToaster } from "@/components/feedback/toast";
import { STARTUP_IMAGES } from "@/lib/startup-images";
import { ServiceWorkerRegister } from "@/components/nav/ServiceWorkerRegister";
import { SHARE_DESCRIPTION, shareMeta, siteUrl } from "@/lib/share-meta";
import "./globals.css";
import "@/components/brand/mascot-themes.css";

const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Só para o nome "bubbly" (logo: Nunito bem grossa)
const brand = Nunito({ variable: "--font-brand-face", subsets: ["latin"], weight: "900" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "bubbly", template: "%s · bubbly" },
  description: "Agenda, clientes e lembretes do seu estúdio.",
  appleWebApp: {
    capable: true,
    title: "bubbly",
    // "default", não "black-translucent": no iOS 26 o translucent faz o sistema pintar um desfoque (scroll pocket)
    // por cima do topo, o que deixava a faixa clara e embaçada. Com "default" o sistema pinta a barra de status
    // com a cor do elemento fixo opaco do topo (.status-fill), roxo primário sólido.
    statusBarStyle: "default",
    startupImage: STARTUP_IMAGES.map(({ url, media }) => ({ url, media })),
  },
  formatDetection: { telephone: false },
  // Prévia ao mandar o link no WhatsApp/Instagram
  ...shareMeta("bubbly · agenda do seu estúdio", SHARE_DESCRIPTION),
  // O Next só emite mobile-web-app-capable; o iOS só aplica o estilo da barra de status com a versão da Apple
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#6D4AFF",
  colorScheme: "light",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script do splash marca data-splash no <html> antes de o React hidratar
    <html
      lang="pt-BR"
      className={`${quicksand.variable} ${brand.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashGate }} />
        {/* Cores do mascote escolhido já na primeira pintura (o servidor confirma depois, em MascotSync) */}
        <script dangerouslySetInnerHTML={{ __html: mascotGate }} />
      </head>
      <body className="min-h-full">
        <div className="status-fill" aria-hidden="true" />
        <Splash />
        {children}
        <UpdateBanner />
        <AppToaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
