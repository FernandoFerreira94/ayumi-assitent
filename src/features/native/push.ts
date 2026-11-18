"use client";

import { Capacitor } from "@capacitor/core";
import { ANDROID_CHANNEL, type NativePlatform } from "@/features/push/native-core";

/** Token deste aparelho, para saber se está ligado e para desligar depois. */
const TOKEN_KEY = "bubbly:native-push-token";

export function nativePushPlatform(): NativePlatform | null {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("PushNotifications")) return null;
  const p = Capacitor.getPlatform();
  return p === "android" || p === "ios" ? p : null;
}

export function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function keepToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sem armazenamento: só não lembra o estado */
  }
}

export async function nativePermission(): Promise<"granted" | "denied" | "prompt"> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const s = await PushNotifications.checkPermissions();
  return s.receive === "granted" ? "granted" : s.receive === "denied" ? "denied" : "prompt";
}

export class PushDenied extends Error {}

/** Pede permissão, cria o canal (Android) e devolve o token do FCM/APNs. */
export async function registerNativePush(): Promise<string> {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  let s = await PushNotifications.checkPermissions();
  if (s.receive !== "granted") s = await PushNotifications.requestPermissions();
  if (s.receive !== "granted") throw new PushDenied();
  if (Capacitor.getPlatform() === "android") {
    await PushNotifications.createChannel({
      id: ANDROID_CHANNEL,
      name: "Avisos",
      description: "Pendências, respostas das clientes e avisos do dia",
      importance: 4,
      visibility: 1,
      lightColor: "#6D4AFF",
      vibration: true,
    });
  }
  const token = await new Promise<string>((resolve, reject) => {
    const subs: Promise<{ remove: () => Promise<void> }>[] = [];
    const done = () => subs.forEach((p) => void p.then((h) => h.remove()));
    const timer = setTimeout(() => {
      done();
      reject(new Error("push_register_timeout"));
    }, 20_000);
    subs.push(
      PushNotifications.addListener("registration", ({ value }) => {
        clearTimeout(timer);
        done();
        resolve(value);
      }),
      PushNotifications.addListener("registrationError", ({ error }) => {
        clearTimeout(timer);
        done();
        reject(new Error(error));
      }),
    );
    PushNotifications.register().catch((e: unknown) => {
      clearTimeout(timer);
      done();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
  });
  keepToken(token);
  return token;
}

export async function unregisterNativePush(): Promise<void> {
  keepToken(null);
  const { PushNotifications } = await import("@capacitor/push-notifications");
  await PushNotifications.unregister().catch(() => {});
}
