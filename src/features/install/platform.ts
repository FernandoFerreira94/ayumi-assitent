/** Qual passo a passo mostrar: cada sistema instala o PWA por um caminho diferente. */
export type InstallPlatform = "ios" | "android" | "other";

/**
 * O iPadOS se apresenta como Mac; o que entrega é ter toque, que nenhum Mac tem.
 * Recebe os dados do navegador em vez de ler `navigator`, para dar para testar.
 */
export function detectPlatform(userAgent: string, maxTouchPoints: number): InstallPlatform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}
