import { expect, test } from "./fixtures";

test("com a localização liberada, o Mimo avisa a chuva de hoje", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -23.55, longitude: -46.63 });
  // CI nunca chama a API de verdade
  await context.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      json: {
        current: { temperature_2m: 21, weather_code: 63, is_day: 1 },
        daily: { precipitation_probability_max: [90] },
      },
    }),
  );
  await page.goto("/agenda");
  await page.getByRole("button", { name: "Ver mais sobre o dia" }).click();
  await expect(page.getByText("Previsão de chuva hoje. Leva o guarda-chuva!")).toBeVisible();
});
