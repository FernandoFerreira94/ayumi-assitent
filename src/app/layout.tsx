import type { Metadata, Viewport } from "next";
import { Quicksand, Varela_Round } from "next/font/google";
import { AppToaster } from "@/components/feedback/toast";
import { ServiceWorkerRegister } from "@/components/nav/ServiceWorkerRegister";
import "./globals.css";

const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Só para o nome "mimo"
const varela = Varela_Round({ variable: "--font-varela", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { default: "mimo", template: "%s · mimo" },
  description: "Agenda, clientes e lembretes do seu estúdio.",
  appleWebApp: { capable: true, title: "mimo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F8F7FC",
  colorScheme: "light",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${quicksand.variable} ${varela.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <AppToaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
