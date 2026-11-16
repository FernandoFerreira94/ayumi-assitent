/*
 * Gera as imagens-fonte dos apps da loja (Capacitor) em mobile/assets, a partir da mesma Bolha de `pnpm icons`.
 * Depois rode `npm run assets` dentro de mobile/ para gerar todos os tamanhos do Android e do iPhone.
 */
import "./lib/ignore-css";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Mascot } from "../src/components/brand/Mascot";

const ICON_BG = "linear-gradient(160deg, #F4F0FF 0%, #E3DAFF 100%)";
// Mesmo roxo do primeiro quadro do splash do PWA: a casca nativa emenda direto no splash do app web
const SPLASH_BG = "#6D4AFF";

/** `scale` é a largura da Bolha em fração da imagem; `bg` nulo deixa o fundo transparente. */
const IMAGES = [
  // iPhone e ícone legado do Android: fundo opaco (a App Store recusa ícone com transparência)
  { out: "mobile/assets/icon-only.png", size: 1024, scale: 0.74, bg: ICON_BG },
  // Ícone adaptativo do Android: a frente fica na zona segura (~61% do centro), o fundo é recortado pelo sistema
  { out: "mobile/assets/icon-foreground.png", size: 1024, scale: 0.5, bg: null },
  { out: "mobile/assets/icon-background.png", size: 1024, scale: 0, bg: ICON_BG },
  // Splash (mínimo 2732 px): roxo com a Bolha pequena no centro; o tema do app é sempre claro, o escuro repete
  { out: "mobile/assets/splash.png", size: 2732, scale: 0.18, bg: SPLASH_BG },
  { out: "mobile/assets/splash-dark.png", size: 2732, scale: 0.18, bg: SPLASH_BG },
];

async function main() {
  const svg = renderToStaticMarkup(<Mascot size={340} />);
  await mkdir("mobile/assets", { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  for (const { out, size, scale, bg } of IMAGES) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;width:${size}px;height:${size}px;background:${bg ?? "transparent"};display:grid;place-items:center}
       svg{width:${size * scale}px;height:auto}</style>${scale > 0 ? svg : ""}`,
    );
    await writeFile(out, await page.screenshot({ omitBackground: !bg }));
    console.log(`${out} (${size}px)`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error("Falha ao gerar as imagens dos apps:", err);
  process.exit(1);
});
