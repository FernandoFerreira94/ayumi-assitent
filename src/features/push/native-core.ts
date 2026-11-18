import { z } from "zod";
import type { PushPayload } from "./port";

/**
 * Push do app da loja. A inscrição mora na mesma tabela do Web Push (push_subscriptions), com o endpoint
 * "fcm:<token>" (Android, Firebase) ou "apns:<token>" (iPhone, Apple). p256dh/auth ficam "native".
 */
export type NativePlatform = "android" | "ios";
export const NATIVE_PREFIX = { android: "fcm:", ios: "apns:" } as const satisfies Record<NativePlatform, string>;
export const NATIVE_KEY = "native";
/** Canal de notificação do Android (criado pelo app ao ativar; o FCM manda para ele). */
export const ANDROID_CHANNEL = "avisos";
/** Ícone pequeno (silhueta) em mobile/android/app/src/main/res/drawable. */
export const ANDROID_ICON = "ic_stat_bubbly";
export const BRAND_COLOR = "#6D4AFF";

export const nativeSubscriptionSchema = z.object({
  platform: z.enum(["android", "ios"]),
  // FCM: ~160 caracteres com ":" "-" "_"; APNs: 64 hex. Nada de espaço nem barra (vai num caminho de URL).
  token: z.string().regex(/^[A-Za-z0-9_:.-]{20,4096}$/),
});

export function nativeEndpoint(platform: NativePlatform, token: string): string {
  return `${NATIVE_PREFIX[platform]}${token}`;
}

export function parseNativeEndpoint(endpoint: string): { platform: NativePlatform; token: string } | null {
  if (endpoint.startsWith(NATIVE_PREFIX.android)) return { platform: "android", token: endpoint.slice(4) };
  if (endpoint.startsWith(NATIVE_PREFIX.ios)) return { platform: "ios", token: endpoint.slice(5) };
  return null;
}

/** Corpo do FCM HTTP v1. `data.url` abre a tela certa ao tocar (NativeBridge). */
export function fcmMessage(token: string, p: PushPayload) {
  return {
    message: {
      token,
      notification: { title: p.title, body: p.body },
      data: { url: p.url, ...(p.tag ? { tag: p.tag } : {}) },
      android: {
        priority: "HIGH",
        ttl: "21600s",
        notification: {
          channel_id: ANDROID_CHANNEL,
          icon: ANDROID_ICON,
          color: BRAND_COLOR,
          ...(p.tag ? { tag: p.tag } : {}),
        },
      },
    },
  };
}

/** Corpo do APNs. O que fica fora de `aps` chega ao app como `notification.data`. */
export function apnsBody(p: PushPayload) {
  return {
    aps: { alert: { title: p.title, body: p.body }, sound: "default", ...(p.tag ? { "thread-id": p.tag } : {}) },
    url: p.url,
  };
}

/** Só caminhos do próprio app ao tocar no aviso (nada de abrir site de fora pela notificação). */
export function safeAppPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/painel";
  return raw;
}
