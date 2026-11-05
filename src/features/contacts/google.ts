import { GoogleApiError, GoogleAuthError } from "@/features/google/calendar";
import { normalize, type Parsed } from "./parse";

type Person = { names?: { displayName?: string }[]; phoneNumbers?: { value?: string }[] };
type Page = { connections?: Person[]; nextPageToken?: string };

/** Lê os contatos do Google (People API). 401/403 = permissão ausente ou expirada: reconectar. */
export async function fetchGoogleContacts(accessToken: string, fetchImpl: typeof fetch = fetch): Promise<Parsed> {
  const raw: { name: string; phone: string }[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const url = new URL("https://people.googleapis.com/v1/people/me/connections");
    url.searchParams.set("personFields", "names,phoneNumbers");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    let res: Response;
    try {
      res = await fetchImpl(url, { headers: { authorization: `Bearer ${accessToken}` } });
    } catch {
      throw new GoogleApiError("rede");
    }
    if (res.status === 401 || res.status === 403) throw new GoogleAuthError(String(res.status));
    if (!res.ok) throw new GoogleApiError(String(res.status));
    const body = (await res.json()) as Page;
    for (const p of body.connections ?? []) {
      const name = p.names?.[0]?.displayName ?? "";
      const phones = p.phoneNumbers ?? [];
      if (phones.length === 0) raw.push({ name, phone: "" });
      for (const ph of phones) raw.push({ name, phone: ph.value ?? "" });
    }
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return normalize(raw);
}
