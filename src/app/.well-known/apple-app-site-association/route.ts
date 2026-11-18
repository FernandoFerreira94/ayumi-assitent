import { appleAppSiteAssociation } from "@/features/native/well-known";

// Lido pela Apple (CDN) ao instalar o app: liga o domínio ao app da App Store. Sem extensão e em JSON.
export function GET() {
  const body = appleAppSiteAssociation(process.env.APPLE_TEAM_ID);
  if (!body) return new Response(null, { status: 404 });
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
