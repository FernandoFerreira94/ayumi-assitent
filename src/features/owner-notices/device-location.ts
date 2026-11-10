/**
 * Localização do aparelho para os avisos do dia: posição pelo GPS do celular e cidade/UF pelo serviço gratuito
 * da BigDataCloud (sem chave, feito para chamada no navegador). Se a cidade não vier, a previsão do tempo
 * funciona mesmo assim; só os feriados da cidade ficam de fora.
 */
export type DevicePlace = { latitude: number; longitude: number; city: string | null; state: string | null };

export function currentPosition(timeout = 15_000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 30 * 60_000,
      timeout,
    });
  });
}

/** "BR-SP" → "SP". */
export const ufFromCode = (code: string | undefined) => (code && /^BR-[A-Z]{2}$/.test(code) ? code.slice(3) : null);

export async function placeOf(latitude: number, longitude: number): Promise<DevicePlace> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
      { signal: AbortSignal.timeout(6_000) },
    );
    const d = (await res.json()) as { city?: string; locality?: string; principalSubdivisionCode?: string };
    return { latitude, longitude, city: d.city || d.locality || null, state: ufFromCode(d.principalSubdivisionCode) };
  } catch {
    return { latitude, longitude, city: null, state: null };
  }
}

/** Permissão já dada (não abre o pedido do iPhone); false quando não dá para saber. */
export async function locationGranted(): Promise<boolean> {
  try {
    const p = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return p?.state === "granted";
  } catch {
    return false;
  }
}
