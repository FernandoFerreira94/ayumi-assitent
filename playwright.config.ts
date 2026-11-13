import { defineConfig, devices } from "@playwright/test";

const { defaultBrowserType: _ignored, ...iphone } = devices["iPhone 15"];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "iphone-15",
      // Os specs do celular continuam só aqui; os de tela larga rodam nos dois projetos abaixo
      testIgnore: /largura\.spec\.ts/,
      use: {
        ...iphone,
        browserName: "chromium",
        // Local: PW_CHROMIUM_PATH aponta para um Chromium já instalado. No CI usa o do `playwright install`.
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
    {
      name: "ipad-paisagem",
      testMatch: /largura\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 1024, height: 768 },
        hasTouch: true,
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
    {
      name: "desktop",
      testMatch: /largura\.spec\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm exec next start -p 3100",
    url: "http://localhost:3100/login",
    // e-mails liberados para os testes de cadastro
    env: { ALLOWED_EMAILS: "novo@e2e.test" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
