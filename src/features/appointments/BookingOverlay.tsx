"use client";

import Link from "next/link";
import { Mascot } from "@/components/brand/Mascot";
import { messageFor, type ErrorCode } from "@/lib/errors";

/** Cada etapa só muda quando o servidor responde; nada fica verde antes. */
export type Step = "wait" | "run" | "done" | "fail" | "warn";

export type Booking = {
  steps: Step[];
  /** Passou de alguns segundos sem resposta: o texto avisa que a conexão está lenta. */
  slow: boolean;
  who: string;
  service: string;
  result:
    | null
    | { kind: "ok"; id: string }
    /** Salvou, mas o lembrete não vai sair: "off" = WhatsApp desconectado, "unavailable" = não deu para conferir. */
    | { kind: "warn"; id: string; reason: "off" | "unavailable" }
    | { kind: "error"; code: ErrorCode | "TIMEOUT" };
};

const STEPS = ["Conferindo se o horário está livre", "Salvando na agenda", "Programando o lembrete no WhatsApp"];
const RIM = ["#6D4AFF", "#B9A6FF", "#FF8FB1", "#E5547F", "#8E73FF"];

/** A Bolha por cima de tudo: concentrada anotando enquanto agenda, depois o resultado. */
export function BookingOverlay({
  booking,
  onDone,
  onRetry,
  onPickAnother,
  onClose,
}: {
  booking: Booking;
  /** Agendamento salvo: fecha a folha e pisca o horário na agenda. */
  onDone: (id: string) => void;
  onRetry: () => void;
  /** Horário ocupado: volta para a folha preenchida, com o campo de horário marcado. */
  onPickAnother: () => void;
  onClose: () => void;
}) {
  const { result, steps } = booking;
  const done = steps.filter((s) => s === "done").length;

  return (
    <div
      // No resultado com aviso são dois botões: o respiro é curto para caber num iPhone sem rolar
      className={`flex min-h-full flex-col items-center gap-2.5 px-6 pb-[max(env(safe-area-inset-bottom),24px)] text-center ${
        result ? "justify-start pt-6" : "justify-center pt-10"
      }`}
    >
      {result ? (
        <ResultBubble kind={result.kind} />
      ) : (
        <Mascot mood="focused" size={210} className="overflow-visible">
          <NoteCard done={done} />
        </Mascot>
      )}

      <div role="status" aria-live="polite" className="grid gap-1">
        <h2 className="text-2xl font-bold">{title(booking)}</h2>
        <p className="mx-auto min-h-5 max-w-[30ch] text-sm font-semibold text-muted">
          {result?.kind === "error" ? "" : result ? booking.who : booking.slow ? "A conexão está lenta, mas sigo tentando." : "A Bolha está cuidando de tudo."}
        </p>
      </div>

      <ul className="mt-1 grid w-full max-w-72 gap-2.5 text-left">
        {STEPS.map((label, i) => (
          <li key={label} data-s={steps[i]} className="booking-step grid grid-cols-[24px_1fr] items-center gap-2.5 text-sm font-semibold">
            <StepIcon />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {result ? (
        <div className="booking-res mt-1.5 grid w-full max-w-76 gap-2.5">
          {result.kind === "ok" ? (
            <>
              <div className="glass grid gap-0.5 rounded-2xl px-4 py-3 text-left text-sm">
                <b className="text-[15px]">{booking.service}</b>
                <span className="font-semibold text-muted">Lembrete programado no WhatsApp.</span>
              </div>
              <button type="button" autoFocus onClick={() => onDone(result.id)} className="btn-tint min-h-13 rounded-full px-5 font-bold">
                Ver na agenda
              </button>
            </>
          ) : result.kind === "warn" ? (
            <>
              <p className="rounded-2xl bg-wait-bg px-4 py-3 text-left text-sm font-semibold text-wait">
                {result.reason === "off"
                  ? "O WhatsApp está desconectado, então o lembrete não vai sair. O horário já está na agenda."
                  : "Não deu para conferir o WhatsApp agora, então o lembrete pode não sair. O horário já está na agenda."}
              </p>
              <Link
                href="/ajustes#whatsapp"
                autoFocus
                onClick={() => onDone(result.id)}
                className="btn-tint flex min-h-13 items-center justify-center rounded-full px-5 font-bold"
              >
                Reconectar WhatsApp
              </Link>
              <button type="button" onClick={() => onDone(result.id)} className="btn-glass min-h-12 rounded-full px-5 font-bold">
                Fechar
              </button>
            </>
          ) : (
            <>
              <p className="rounded-2xl bg-fail-bg px-4 py-3 text-left text-sm font-semibold text-fail">{failText(result.code)}</p>
              <button
                type="button"
                autoFocus
                onClick={result.code === "SLOT_TAKEN" ? onPickAnother : onRetry}
                className="btn-tint min-h-13 rounded-full px-5 font-bold"
              >
                {result.code === "SLOT_TAKEN" ? "Escolher outro horário" : "Tentar de novo"}
              </button>
              <button type="button" onClick={onClose} className="btn-glass min-h-12 rounded-full px-5 font-bold">
                Fechar
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function title({ result }: Booking) {
  if (!result) return "Agendando…";
  if (result.kind === "ok") return "Agendado!";
  if (result.kind === "warn") return "Agendado, sem lembrete";
  return "Não deu para agendar";
}

function failText(code: ErrorCode | "TIMEOUT") {
  // Passou do prazo sem resposta: pode ter salvo, então pede para conferir antes de repetir
  if (code === "TIMEOUT") return "O servidor demorou demais para responder. Confira a agenda antes de tentar de novo.";
  return messageFor(code);
}

function StepIcon() {
  return (
    <span className="step-ic" aria-hidden="true">
      <svg viewBox="0 0 12 12" className="ck">
        <path d="M2.5 6.2l2.3 2.3 4.7-4.9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 12 12" className="x">
        <path d="M3 3l6 6M9 3l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 12 12" className="ex">
        <path d="M6 2.5v4.2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="6" cy="9.3" r="1.1" fill="#fff" />
      </svg>
    </span>
  );
}

/** A folhinha que a Bolha segura e marca: dois quadradinhos por etapa concluída, com o lápis correndo. */
function NoteCard({ done }: { done: number }) {
  return (
    <g transform="translate(240 352) rotate(-3.4)">
      <rect x="-84" y="-54" width="168" height="108" rx="16" fill="#fff" stroke="#E6E2F3" strokeWidth="3" />
      <path d="M-84 -28V-38A16 16 0 0 1 -68 -54H68A16 16 0 0 1 84 -38V-28Z" fill="#6D4AFF" />
      <circle cx="-50" cy="-54" r="5" fill="#fff" />
      <circle cx="50" cy="-54" r="5" fill="#fff" />
      {Array.from({ length: 8 }, (_, n) => {
        const x = -68 + (n % 4) * 36;
        const y = -16 + Math.floor(n / 4) * 30;
        const on = n < done * 2;
        return (
          <g key={n}>
            <rect x={x} y={y} width="28" height="22" rx="6" fill={on ? "#EEE9FF" : "#F6F4FC"} />
            {on ? (
              <path
                d={`M${x + 8} ${y + 11}L${x + 12} ${y + 15}L${x + 20} ${y + 7}`}
                className="note-tick"
                fill="none"
                stroke="#6D4AFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </g>
        );
      })}
      <g className="note-pencil">
        <g transform="rotate(-40)">
          <rect x="-6" y="-46" width="12" height="40" rx="3" fill="#E5547F" />
          <path d="M-6 -6H6L0 6Z" fill="#FFD9A8" />
        </g>
      </g>
      <g fill="#C9BBFF">
        <ellipse cx="-86" cy="4" rx="22" ry="18" transform="rotate(17 -86 4)" />
        <ellipse cx="86" cy="4" rx="22" ry="18" transform="rotate(-17 86 4)" />
      </g>
    </g>
  );
}

/** Resultado: no ok o anel fecha, a Bolha pula com brilhos e o ok verde aparece; no erro ela só se preocupa. */
function ResultBubble({ kind }: { kind: "ok" | "warn" | "error" }) {
  return (
    <div className="relative grid size-50 place-items-center">
      {kind !== "error" ? (
        <svg viewBox="0 0 200 200" className="booking-ring absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id="booking-ring" x1="0" y1="0" x2="1" y2="1">
              {RIM.map((c, i) => (
                <stop key={c} offset={i / (RIM.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" pathLength="1" fill="none" stroke="url(#booking-ring)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : null}
      {kind === "ok"
        ? Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className="booking-spark"
              style={{ "--a": `${i * 36 + 8}deg`, background: RIM[i % RIM.length] } as React.CSSProperties}
              aria-hidden="true"
            />
          ))
        : null}
      <span className={kind === "ok" ? "bolha-pula" : kind === "error" ? "bolha-treme" : ""}>
        <Mascot mood={kind === "error" ? "worried" : kind === "ok" ? "happy" : "neutral"} size={126} />
      </span>
      {kind !== "error" ? (
        <svg viewBox="0 0 40 40" className="booking-badge absolute left-[138px] top-[134px] size-10" data-kind={kind} aria-hidden="true">
          <circle cx="20" cy="20" r="20" />
          {kind === "ok" ? <path d="M11 20.5l5.5 5.5 12-12" /> : <path d="M20 11v11M20 29v.5" />}
        </svg>
      ) : null}
    </div>
  );
}
