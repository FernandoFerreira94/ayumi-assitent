/**
 * Roteiro do vídeo de demonstração para a verificação de escopos sensíveis do Google (cenas 0–6).
 *
 * O Playwright só conduz o navegador: a gravação é feita por um gravador de tela (OBS ou Win+Alt+R),
 * porque o vídeo do Playwright não mostra a barra de endereço, e o Google exige ver a URL com client_id=.
 *
 * Regras (ver README): conta Google de TESTE, dados fictícios, senha do Google sempre digitada à mão,
 * perfil do Chrome temporário fora do repo (apagado no fim), nada de .env, cookies ou tokens em arquivo.
 *
 * Uso: pnpm exec tsx scripts/demo-video/record.ts [--cdp http://localhost:9222]
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { CAPTIONS, type CaptionId, type Cue, toSrt } from "./captions";

const SITE = "https://bubbly.app.br";
const APP = "https://app.bubbly.app.br";
const WINDOW = { width: 1280, height: 800 };
const OUT_DIR = join(import.meta.dirname, "out"); // ignorado pelo git (ver .gitignore desta pasta)

const rl = createInterface({ input: process.stdin, output: process.stdout });
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

/** Para o roteiro até o Fernando apertar Enter (login do Google, ações feitas à mão). */
async function enter(instrucao: string) {
  await rl.question(`\n▶ ${instrucao}\n  [Enter para seguir] `);
}

// --- Legendas: cada cue() fecha a legenda anterior e abre a próxima no tempo real da gravação.
let t0 = 0;
const cues: Cue[] = [];
const now = () => (Date.now() - t0) / 1000;
function cue(id: CaptionId) {
  const caption = CAPTIONS.find((c) => c.id === id)!;
  const t = now();
  const last = cues.at(-1);
  if (last && last.end === Infinity) last.end = t;
  cues.push({ start: t, end: Infinity, text: caption.text });
  console.log(`  [${t.toFixed(1)}s] ${caption.text}`);
}

/** Tenta a ação automática; se o seletor não bater (UI mudou), pede para fazer à mão em vez de quebrar a gravação. */
async function act(descricao: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch {
    await enter(`Não consegui "${descricao}" sozinho. Faça à mão na janela do Chrome.`);
  }
}

async function show(page: Page, url: string, holdSeconds = 0) {
  await page.bringToFront();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (holdSeconds) await sleep(holdSeconds);
}

/** Passa o mouse e rola até o elemento para ele aparecer bem no vídeo. */
async function point(page: Page, locator: ReturnType<Page["getByRole"]>, holdSeconds = 2) {
  await locator.first().scrollIntoViewIfNeeded({ timeout: 5_000 });
  await locator.first().hover({ timeout: 5_000 });
  await sleep(holdSeconds);
}

async function openBrowser(): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const cdpIndex = process.argv.indexOf("--cdp");
  if (cdpIndex > -1) {
    // Chrome aberto pelo Fernando com --remote-debugging-port (útil se o Google recusar o login no Chrome automatizado).
    const browser: Browser = await chromium.connectOverCDP(process.argv[cdpIndex + 1] ?? "http://localhost:9222");
    return { context: browser.contexts()[0]!, close: () => browser.close() };
  }
  const profile = mkdtempSync(join(tmpdir(), "bubbly-demo-")); // fora do repo; apagado no fim
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chrome",
    headless: false,
    viewport: null, // a página usa a janela inteira; barra de endereço continua visível
    args: [`--window-size=${WINDOW.width},${WINDOW.height}`, "--window-position=0,0", "--lang=en-US"],
  });
  return {
    context,
    close: async () => {
      await context.close();
      rmSync(profile, { recursive: true, force: true });
    },
  };
}

async function main() {
  const { context, close } = await openBrowser();
  const app = context.pages()[0] ?? (await context.newPage());

  await enter("Posicione a janela do Chrome (1280x800), comece a GRAVAR A TELA e então aperte Enter.");
  t0 = Date.now();

  // Cena 0: site público
  await show(app, SITE);
  cue("s0-home");
  await sleep(5);
  cue("s0-privacy-link");
  await act("mostrar o link da Política de Privacidade", () =>
    point(app, app.getByRole("link", { name: /privacidade/i }), 4),
  );

  // Cena 1: login com Google
  await show(app, `${APP}/login`);
  cue("s1-login");
  await act("mostrar Privacidade e Termos", async () => {
    await point(app, app.getByRole("link", { name: /privacidade/i }), 2);
    await point(app, app.getByRole("link", { name: /termos/i }), 2);
  });
  cue("s1-click-google");
  await act("clicar em Entrar com Google", () => app.getByRole("button", { name: /entrar com google/i }).click());
  cue("s1-google-signin");
  await enter("Faça o login com a conta de TESTE (e-mail e senha à mão). Pare quando a tela de consentimento abrir.");
  cue("s1-consent");
  console.log("  Segurando 8 s na tela de consentimento (URL com client_id= e os escopos)…");
  await sleep(8);
  cue("s1-accept");
  await enter("Aceite o consentimento à mão. Quando o Bubbly abrir, aperte Enter.");

  // Cena 2: calendar.events (criar, editar, cancelar)
  await show(app, `${APP}/agenda`, 2);
  cue("s2-create");
  await act("abrir Novo agendamento", () =>
    app.getByRole("button", { name: /novo agendamento/i }).first().click({ timeout: 5_000 }),
  );
  await enter("Crie o agendamento de teste com a cliente fictícia (ex.: Maria Teste, amanhã 10:00) e salve.");
  const google = await context.newPage();
  await show(google, "https://calendar.google.com");
  cue("s2-google-shows");
  await enter("Abra o dia do agendamento no Google Agenda e deixe o evento à vista.");

  await app.bringToFront();
  cue("s2-edit");
  await enter("No Bubbly, mude o horário do agendamento (ex.: 10:00 → 14:00) e salve.");
  await google.bringToFront();
  await google.reload();
  cue("s2-google-updated");
  await enter("Mostre o evento no novo horário.");

  await app.bringToFront();
  cue("s2-cancel");
  await enter("No Bubbly, cancele o agendamento de teste.");
  await google.bringToFront();
  await google.reload();
  cue("s2-google-removed");
  await enter("Mostre que o evento sumiu do Google Agenda.");

  // Cena 3: horário ocupado vindo do Google
  await app.bringToFront();
  await app.reload();
  cue("s3-busy");
  await enter("Na agenda do Bubbly, vá até o dia do \"Dentist\" e deixe o bloco ocupado à vista.");

  // Cena 4: contacts.readonly
  await show(app, `${APP}/clientes`, 1);
  cue("s4-import-open");
  await act("abrir Importar > Do Google Contatos", async () => {
    await app.getByRole("button", { name: /^importar$/i }).first().click({ timeout: 5_000 });
    await sleep(1);
    await app.getByRole("button", { name: /do google contatos/i }).click({ timeout: 5_000 });
  });
  cue("s4-select");
  await enter("Marque 2 ou 3 contatos de teste.");
  await act("clicar em Importar N", () => app.getByRole("button", { name: /^importar \d+$/i }).click({ timeout: 5_000 }));
  cue("s4-imported");
  await sleep(4);
  await show(google, "https://contacts.google.com", 2);
  cue("s4-google-unchanged");
  await enter("Mostre que os contatos continuam iguais no Google Contatos.");

  // Cena 5: Ajustes, privacidade e desconectar/reconectar
  await show(app, `${APP}/ajustes`, 1);
  cue("s5-settings-links");
  await act("rolar até Política de privacidade e Termos", () =>
    point(app, app.getByRole("link", { name: /política de privacidade/i }), 3),
  );
  await show(google, `${SITE}/privacidade#google`);
  cue("s5-privacy-google");
  await sleep(8);
  await show(app, `${APP}/ajustes/calendarios`, 1);
  cue("s5-disconnect");
  await act("desligar o Google Agenda", async () => {
    await app.getByRole("switch", { name: /google agenda/i }).click({ timeout: 5_000 });
    await sleep(2);
    await app.getByRole("alertdialog").getByRole("button", { name: /^desconectar$/i }).click({ timeout: 5_000 });
  });
  await sleep(3);
  cue("s5-reconnect");
  await act("religar o Google Agenda", () => app.getByRole("switch", { name: /google agenda/i }).click({ timeout: 5_000 }));
  await enter("Escolha a conta de teste (senha à mão, se pedir). Pare na tela de consentimento.");
  cue("s5-consent");
  console.log("  Segurando 8 s na tela de consentimento…");
  await sleep(8);
  await enter("Aceite à mão. Quando voltar ao Bubbly, aperte Enter.");
  cue("s5-back");
  await sleep(5);

  // Cena 6: privacidade#google e Excluir minha conta (sem concluir)
  await show(app, `${SITE}/privacidade#google`);
  cue("s6-privacy");
  await sleep(9);
  await show(app, `${APP}/perfil`, 1);
  cue("s6-delete");
  await act("abrir Excluir minha conta", () =>
    app.getByRole("button", { name: /excluir minha conta/i }).first().click({ timeout: 5_000 }),
  );
  await sleep(6);
  await app.keyboard.press("Escape"); // fecha a folha sem digitar EXCLUIR
  cue("s6-end");
  await sleep(4);

  const last = cues.at(-1)!;
  last.end = now();
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `subtitles.en.${new Date().toISOString().replace(/[:.]/g, "-")}.srt`);
  writeFileSync(file, toSrt(cues));
  console.log(`\n✓ Pare a gravação da tela. Legendas sincronizadas em: ${file}`);

  rl.close();
  await close();
}

main().catch(async (err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
