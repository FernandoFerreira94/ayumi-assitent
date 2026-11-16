import { assetLinks } from "@/features/native/well-known";

// Lido pelo Android ao instalar o app: liga o domínio ao app da Play Store (ver features/native/well-known.ts)
export function GET() {
  return Response.json(assetLinks(process.env.ANDROID_CERT_SHA256), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
