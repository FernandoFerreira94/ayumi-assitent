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
    if (res.status === 401 || res.status === 403) throw new GoogleAuthError(String(res.status));
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
