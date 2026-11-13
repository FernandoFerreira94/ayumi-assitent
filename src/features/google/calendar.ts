// Cliente mínimo da API REST do Google Agenda (sem dependência pesada). `fetch` é injetável para testes.
export type CalendarEventInput = {
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  /** E-mail da cliente: ela recebe o convite do Google. */
  attendeeEmail?: string;
};

export interface CalendarPort {
  createEvent(e: CalendarEventInput): Promise<string>;
  updateEvent(id: string, e: CalendarEventInput): Promise<void>;
  deleteEvent(id: string): Promise<void>;
}

/** Evento de entrada (já existia no Google Agenda). */
export type ExternalEvent = { id: string; title: string; startsAt: Date; endsAt: Date };

export interface CalendarReader {
  listEvents(from: Date, to: Date): Promise<ExternalEvent[]>;
}

/** Acesso ao Google expirou/foi revogado: precisa reconectar. */
export class GoogleAuthError extends Error {}
/** Qualquer outra falha (rede, 5xx, cota). */
export class GoogleApiError extends Error {}

const BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
// avisa os convidados de criação, mudança e cancelamento
const NOTIFY = "?sendUpdates=all";

const body = (e: CalendarEventInput) => ({
  summary: e.summary,
  description: e.description,
  start: { dateTime: e.startsAt.toISOString(), timeZone: e.timeZone },
  end: { dateTime: e.endsAt.toISOString(), timeZone: e.timeZone },
  ...(e.attendeeEmail ? { attendees: [{ email: e.attendeeEmail }] } : {}),
});

type RawEvent = {
  id?: string;
  status?: string;
  summary?: string;
  transparency?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
};

/** Só vira horário ocupado o evento com hora marcada, confirmado, que "mostra como ocupado" e que a dona não recusou. */
export function toExternalEvent(r: RawEvent): ExternalEvent | null {
  if (!r.id || r.status === "cancelled" || r.transparency === "transparent") return null;
  if (!r.start?.dateTime || !r.end?.dateTime) return null; // dia inteiro: aniversários, feriados
  if (r.attendees?.some((a) => a.self && a.responseStatus === "declined")) return null;
  const startsAt = new Date(r.start.dateTime);
  const endsAt = new Date(r.end.dateTime);
  if (!(endsAt > startsAt)) return null;
  return { id: r.id, title: r.summary?.trim() || "Evento do Google", startsAt, endsAt };
}

const MAX_PAGES = 10;

export function googleCalendarReader(accessToken: string, fetchImpl: typeof fetch = fetch): CalendarReader {
  return {
    async listEvents(from, to) {
      const out: ExternalEvent[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const q = new URLSearchParams({
          timeMin: from.toISOString(),
          timeMax: to.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "250",
          fields: "nextPageToken,items(id,status,summary,transparency,start,end,attendees(self,responseStatus))",
        });
        if (pageToken) q.set("pageToken", pageToken);
        let res: Response;
        try {
          res = await fetchImpl(`${BASE}?${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        } catch {
          throw new GoogleApiError("network");
        }
        if (res.status === 401) throw new GoogleAuthError("401");
        if (res.status === 403) {
          let reason = "";
          try {
            const j = (await res.clone().json()) as { error?: { errors?: { reason?: string }[]; message?: string } };
            reason = j.error?.errors?.[0]?.reason ?? j.error?.message ?? "";
          } catch {
            /* corpo ilegível */
          }
          if (/accessNotConfigured|rateLimit|quota|disabled|not been used/i.test(reason))
            throw new GoogleApiError(`403 ${reason}`);
          throw new GoogleAuthError(`403 ${reason}`);
        }
        if (!res.ok) throw new GoogleApiError(String(res.status));
        const j = (await res.json()) as { items?: RawEvent[]; nextPageToken?: string };
        for (const r of j.items ?? []) {
          const e = toExternalEvent(r);
          if (e) out.push(e);
        }
        pageToken = j.nextPageToken;
        if (!pageToken) return out;
      }
      // mais páginas que o limite: melhor falhar do que apagar eventos que não vieram
      throw new GoogleApiError("muitas páginas");
    },
  };
}

export function googleCalendar(accessToken: string, fetchImpl: typeof fetch = fetch): CalendarPort {
  async function call(method: string, url: string, payload?: unknown, okOn404 = false) {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
    } catch {
      throw new GoogleApiError("network");
    }
    if (res.status === 401) throw new GoogleAuthError("401");
    if (res.status === 403) {
      // 403 pode ser API desativada no projeto ou cota: reconectar não resolve. Só permissão pede reconectar.
      let reason = "";
      try {
        const j = (await res.clone().json()) as { error?: { errors?: { reason?: string }[]; message?: string } };
        reason = j.error?.errors?.[0]?.reason ?? j.error?.message ?? "";
      } catch {
        /* corpo ilegível: trata como permissão */
      }
      if (/accessNotConfigured|rateLimit|quota|disabled|not been used/i.test(reason))
        throw new GoogleApiError(`403 ${reason}`);
      throw new GoogleAuthError(`403 ${reason}`);
    }
    if (res.status === 404 && okOn404) return null;
    if (!res.ok) throw new GoogleApiError(String(res.status));
    return res.status === 204 ? null : ((await res.json()) as { id?: string });
  }

  return {
    async createEvent(e) {
      const r = await call("POST", BASE + NOTIFY, body(e));
      if (!r?.id) throw new GoogleApiError("sem id");
      return r.id;
    },
    async updateEvent(id, e) {
      await call("PUT", `${BASE}/${encodeURIComponent(id)}${NOTIFY}`, body(e));
    },
    async deleteEvent(id) {
      // 404/410 = já não existe: objetivo cumprido
      await call("DELETE", `${BASE}/${encodeURIComponent(id)}${NOTIFY}`, undefined, true);
    },
  };
}

/** Troca o refresh token por um novo access token. */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ accessToken: string; expiresAt: Date }> {
  let res: Response;
  try {
    res = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  } catch {
    throw new GoogleApiError("network");
  }
  if (res.status === 400 || res.status === 401) throw new GoogleAuthError("invalid_grant");
  if (!res.ok) throw new GoogleApiError(String(res.status));
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: j.access_token, expiresAt: new Date(Date.now() + j.expires_in * 1000) };
}

/** Revoga o acesso no Google (exigência das políticas ao desconectar). Token já inválido conta como revogado. */
export async function revokeToken(token: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const res = await fetchImpl("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (!res.ok && res.status !== 400) throw new GoogleApiError(String(res.status));
}
