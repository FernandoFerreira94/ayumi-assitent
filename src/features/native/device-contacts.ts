"use client";

import { Capacitor } from "@capacitor/core";
import { useSyncExternalStore } from "react";
import { contactName, flattenContacts, type DeviceRaw } from "./device-contacts-core";

/**
 * Agenda do celular, só no app da loja. Confere o plugin (não só a casca): um APK antigo sem o plugin carrega este
 * mesmo site e não pode mostrar o botão. O plugin só é carregado sob demanda.
 */
export function canUseDeviceContacts(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Contacts");
}

export class ContactsDenied extends Error {
  constructor() {
    super("CONTACTS_DENIED");
  }
}

async function plugin() {
  const { Contacts } = await import("@capacitor-community/contacts");
  let s = await Contacts.checkPermissions();
  if (s.contacts !== "granted" && s.contacts !== "limited") s = await Contacts.requestPermissions();
  if (s.contacts !== "granted" && s.contacts !== "limited") throw new ContactsDenied();
  return Contacts;
}

/** Lê nome, telefones e e-mail. Nada sai do celular até a prévia (que não grava) e a escolha de quem importar. */
export async function readDeviceContacts(): Promise<DeviceRaw[]> {
  const Contacts = await plugin();
  const { contacts } = await Contacts.getContacts({ projection: { name: true, phones: true, emails: true } });
  return flattenContacts(contacts);
}

/** Abre a agenda do sistema para escolher uma pessoa. Cancelar devolve null. */
export async function pickDeviceContact(): Promise<{ name: string; phone: string } | null> {
  const Contacts = await plugin();
  try {
    const { contact } = await Contacts.pickContact({ projection: { name: true, phones: true } });
    const phone = contact.phones?.find((p) => p.number?.trim())?.number?.trim() ?? "";
    return { name: contactName(contact.name), phone };
  } catch {
    return null;
  }
}

const noop = () => () => {};
/** true só no app da loja com o plugin; no servidor (e na 1ª renderização) é false, sem diferença de HTML. */
export function useDeviceContacts(): boolean {
  return useSyncExternalStore(noop, canUseDeviceContacts, () => false);
}
