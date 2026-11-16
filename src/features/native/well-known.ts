/**
 * Arquivos que ligam o domínio do app aos apps da loja (links e volta do login abrem o app, não o navegador).
 * Android: /.well-known/assetlinks.json. iPhone: /.well-known/apple-app-site-association.
 * Os valores só existem depois que as contas das lojas forem aprovadas; até lá as rotas respondem vazio/404.
 */

/** Mesmo appId do mobile/capacitor.config.json. Não muda depois de publicado. */
export const APP_ID = "br.app.bubbly";

/** Impressões SHA-256 dos certificados de assinatura do Android (separadas por vírgula; a da Play Console e a de teste). */
export function assetLinks(rawFingerprints: string | undefined) {
  const fingerprints = (rawFingerprints ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  if (fingerprints.length === 0) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: APP_ID, sha256_cert_fingerprints: fingerprints },
    },
  ];
}

/** Team ID da Apple (10 letras/números). Sem ele, não há o que publicar. */
export function appleAppSiteAssociation(rawTeamId: string | undefined) {
  const teamId = (rawTeamId ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(teamId)) return null;
  const appID = `${teamId}.${APP_ID}`;
  return {
    applinks: {
      details: [
        {
          appIDs: [appID],
          // API e webhooks nunca abrem o app; o resto (avisos, links da agenda, volta do login) abre
          components: [{ "/": "/api/*", exclude: true }, { "/": "/*" }],
        },
      ],
    },
    webcredentials: { apps: [appID] },
  };
}
