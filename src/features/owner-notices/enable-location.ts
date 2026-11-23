import type { ErrorCode } from "@/lib/errors";
import { saveDeviceLocation } from "./actions";
import { currentPosition, placeOf } from "./device-location";

export type EnableLocationResult =
  | { ok: true; city: string | null; state: string | null }
  /** Permissão negada nos Ajustes do aparelho. */
  | { ok: false; reason: "denied" }
  /** Sem sinal de GPS agora (ou aparelho sem geolocalização). */
  | { ok: false; reason: "unavailable" }
  | { ok: false; reason: "error"; code: ErrorCode | "NETWORK" };

/** Lê a posição do aparelho (pede a permissão se preciso), acha a cidade e salva no estúdio. */
export async function enableDeviceLocation(): Promise<EnableLocationResult> {
  const pos = await currentPosition().catch((e: GeolocationPositionError | Error) => e);
  if (!("coords" in pos))
    return "code" in pos && pos.code === 1 ? { ok: false, reason: "denied" } : { ok: false, reason: "unavailable" };
  const place = await placeOf(pos.coords.latitude, pos.coords.longitude);
  const res = await saveDeviceLocation(place).catch(() => null);
  if (!res?.ok) return { ok: false, reason: "error", code: res ? res.code : "NETWORK" };
  return { ok: true, ...res.data };
}
