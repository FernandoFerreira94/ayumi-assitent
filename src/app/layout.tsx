import type { Metadata, Viewport } from "next";
import { Quicksand, Varela_Round } from "next/font/google";
import { Splash, splashGate } from "@/components/brand/Splash";
import { AppToaster } from "@/components/feedback/toast";
import { STARTUP_IMAGES } from "@/lib/startup-images";
import { UpdateGate } from "@/components/nav/UpdateGate";
import { ServiceWorkerRegister } from "@/components/nav/ServiceWorkerRegister";
import "./globals.css";

const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Só para o nome "mimo"
const varela = Varela_Round({ variable: "--font-varela", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "mimo", template: "%s · mimo" },
  description: "Agenda, clientes e lembretes do seu estúdio.",
  appleWebApp: {
    capable: true,
    title: "mimo",
    // black-translucent: o app desenha por baixo da barra de status do iPhone, que fica roxa (.status-fill) com letras brancas
    statusBarStyle: "black-translucent",
    startupImage: STARTUP_IMAGES.map(({ url, media }) => ({ url, media })),
  },
  formatDetection: { telephone: false },
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
      className={`${quicksand.variable} ${varela.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashGate }} />
      </head>
      <body className="min-h-full">
        <div className="status-fill" aria-hidden="true" />
        <Splash />
        {children}
        <AppToaster />
        <ServiceWorkerRegister />
        <UpdateGate />
      </body>
    </html>
  );
}
