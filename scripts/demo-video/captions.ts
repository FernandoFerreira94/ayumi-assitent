/**
 * Legendas em inglês do vídeo de demonstração (verificação de escopos sensíveis do Google).
 * Uma fonte só: o record.ts marca o início de cada legenda durante a gravação e gera o .srt sincronizado;
 * `estimate` (segundos) serve só para o .srt de referência versionado (subtitles.en.srt).
 */
export type CaptionId = (typeof CAPTIONS)[number]["id"];

export const CAPTIONS = [
  // Cena 0
  { id: "s0-home", estimate: 6, text: "This is Bubbly (bubbly.app.br), a scheduling app for beauty salons." },
  { id: "s0-privacy-link", estimate: 5, text: "The homepage links to our Privacy Policy." },
  // Cena 1
  { id: "s1-login", estimate: 5, text: "The login page links to our Privacy Policy and Terms of Service." },
  { id: "s1-click-google", estimate: 4, text: "The user clicks “Sign in with Google” (Entrar com Google)." },
  { id: "s1-google-signin", estimate: 15, text: "The user signs in with a Google test account." },
  {
    id: "s1-consent",
    estimate: 8,
    text: "Consent screen: Bubbly requests Google Sign-In, calendar.events and contacts.readonly.",
  },
  { id: "s1-accept", estimate: 6, text: "The user grants access and returns to Bubbly." },
  // Cena 2: calendar.events
  { id: "s2-create", estimate: 20, text: "calendar.events: we create a test appointment for a fictitious client." },
  { id: "s2-google-shows", estimate: 10, text: "Bubbly writes the appointment to the user's Google Calendar as an event." },
  { id: "s2-edit", estimate: 15, text: "When the appointment time is changed in Bubbly…" },
  { id: "s2-google-updated", estimate: 10, text: "…the same Google Calendar event is updated." },
  { id: "s2-cancel", estimate: 12, text: "When the appointment is cancelled in Bubbly…" },
  { id: "s2-google-removed", estimate: 10, text: "…the event is removed from Google Calendar." },
  // Cena 3
  {
    id: "s3-busy",
    estimate: 12,
    text: "Existing Google Calendar events (e.g. “Dentist”) appear in Bubbly only as busy time, so clients cannot book over them.",
  },
  // Cena 4: contacts.readonly
  { id: "s4-import-open", estimate: 8, text: "contacts.readonly: Clients › Import › From Google Contacts." },
  { id: "s4-select", estimate: 10, text: "The user picks which contacts to import as clients." },
  { id: "s4-imported", estimate: 6, text: "Only the selected contacts are copied into Bubbly." },
  { id: "s4-google-unchanged", estimate: 10, text: "Google Contacts is read-only for Bubbly: nothing changes in the user's Google account." },
  // Cena 5
  { id: "s5-settings-links", estimate: 6, text: "Settings shows links to the Privacy Policy and Terms at the bottom." },
  { id: "s5-privacy-google", estimate: 10, text: "The Privacy Policy has a section on how Bubbly uses Google user data." },
  { id: "s5-disconnect", estimate: 10, text: "Settings › Calendars: the user can disconnect Google Calendar at any time." },
  { id: "s5-reconnect", estimate: 8, text: "Reconnecting asks for consent again." },
  { id: "s5-consent", estimate: 8, text: "Same consent screen, same scopes." },
  { id: "s5-back", estimate: 6, text: "Google Calendar is connected again." },
  // Cena 6
  { id: "s6-privacy", estimate: 10, text: "Privacy Policy › Google user data: bubbly.app.br/privacidade#google." },
  {
    id: "s6-delete",
    estimate: 10,
    text: "My profile › Delete my account removes the account and its data. Not completed in this demo.",
  },
  { id: "s6-end", estimate: 4, text: "Thank you." },
] as const satisfies readonly { id: string; estimate: number; text: string }[];

export type Cue = { start: number; end: number; text: string };

/** Segundos → "HH:MM:SS,mmm" do SubRip. */
function srtTime(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(Math.floor(ms / 3_600_000))}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

export function toSrt(cues: Cue[]): string {
  return cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n");
}

/** .srt de referência: as legendas em sequência, cada uma com a duração estimada. */
export function referenceCues(): Cue[] {
  let t = 0;
  return CAPTIONS.map((c) => {
    const cue = { start: t, end: t + c.estimate, text: c.text };
    t += c.estimate;
    return cue;
  });
}
