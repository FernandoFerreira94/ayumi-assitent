/*
 * Gera os ícones do app (aba do navegador, tela de início do iPhone e do Android) a partir da Bolha do código.
 * A Bolha ainda é provisória: quando a peça final chegar, basta rodar `pnpm icons` de novo.
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Mascot } from "../src/components/brand/Mascot";

const BG = "linear-gradient(160deg, #F4F0FF 0%, #E3DAFF 100%)";

/** `scale` é a largura da Bolha em fração do ícone; `bg` nulo deixa o fundo transparente. */
const ICONS = [
  // Aba do navegador: só a Bolha, sem fundo, para ler bem em 16 px
  { out: "src/app/icon.png", size: 64, scale: 1, bg: null },
  // iPhone arredonda sozinho e exige fundo opaco
  { out: "src/app/apple-icon.png", size: 180, scale: 0.74, bg: BG },
  { out: "public/icons/icon-192.png", size: 192, scale: 0.74, bg: BG },
  { out: "public/icons/icon-512.png", size: 512, scale: 0.74, bg: BG },
  // Maskable: o Android recorta em círculo, então a Bolha fica na zona segura (80% do centro)
  { out: "public/icons/icon-maskable-512.png", size: 512, scale: 0.6, bg: BG },
];

async function main() {
  const svg = renderToStaticMarkup(<Mascot size={340} />);
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  for (const { out, size, scale, bg } of ICONS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;width:${size}px;height:${size}px;background:${bg ?? "transparent"};display:grid;place-items:center}
       svg{width:${size * scale}px;height:auto}</style>${svg}`,
    );
    await writeFile(out, await page.screenshot({ omitBackground: !bg }));
    console.log(`${out} (${size}px)`);
  }
  await browser.close();
}

main().catch((err) => {
  console.error("Falha ao gerar os ícones:", err);
  process.exit(1);
});
