import type { ErrorCode } from "@/lib/errors";
import { emitPushChanged } from "@/features/settings/live-events";
import { nativePushPlatform, PushDenied, registerNativePush, unregisterNativePush } from "@/features/native/push";
import { subscribeNativePush, subscribePush } from "./actions";

export type EnablePushResult =
  | { ok: true }
  /** A pessoa tocou em "Não permitir" (ou já tinha bloqueado): o app não pode pedir de novo. */
  | { ok: false; reason: "denied" }
  | { ok: false; reason: "error"; code: ErrorCode | "NETWORK" };

export function keyToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Pede a permissão de aviso e liga o push neste aparelho: nativo (FCM/APNs) no app da loja, Web Push no
 * navegador/PWA. Mesmo caminho dos interruptores de Ajustes › Notificações, sem toasts: quem chama decide o texto.
 */
export async function enablePush(publicKey: string | null): Promise<EnablePushResult> {
  try {
    const platform = nativePushPlatform();
    if (platform) {
      const token = await registerNativePush();
      const res = await subscribeNativePush({ platform, token });
      if (!res.ok) {
        await unregisterNativePush();
        return { ok: false, reason: "error", code: res.code };
      }
    } else {
      if (!publicKey) return { ok: false, reason: "error", code: "PUSH_NOT_CONFIGURED" };
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return { ok: false, reason: "denied" };
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(publicKey),
      });
      const res = await subscribePush(sub.toJSON());
      if (!res.ok) {
        await sub.unsubscribe();
        return { ok: false, reason: "error", code: res.code };
      }
    }
    emitPushChanged();
    return { ok: true };
  } catch (e) {
    return e instanceof PushDenied ? { ok: false, reason: "denied" } : { ok: false, reason: "error", code: "NETWORK" };
  }
}
