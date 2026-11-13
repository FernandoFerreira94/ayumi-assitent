import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { errInfo, log, redactUrl } from "@/lib/log";

export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // sem DSN o Sentry fica desligado
  Sentry.init({
    dsn,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // URL com token (calendário, webhook) não sai daqui inteira
    beforeSend: (event) => scrub(event),
    beforeSendTransaction: (event) => scrub(event),
  });
}

function scrubData(data: Record<string, unknown> | undefined) {
  if (data) for (const [k, v] of Object.entries(data)) if (typeof v === "string") data[k] = redactUrl(v);
}

function scrub<E extends Sentry.Event>(event: E): E {
  if (event.request) {
    if (event.request.url) event.request.url = redactUrl(event.request.url);
    if (event.request.query_string) event.request.query_string = "[redacted]";
  }
  if (event.transaction) event.transaction = redactUrl(event.transaction);
  for (const span of event.spans ?? []) {
    if (span.description) span.description = redactUrl(span.description);
    scrubData(span.data);
  }
  scrubData(event.contexts?.trace?.data);
  return event;
}

// Todo erro de requisição do servidor vira log estruturado e, com DSN, vai ao Sentry.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  log("error", "request_error", { path: redactUrl(request.path), route: context.routePath, ...errInfo(err) });
  Sentry.captureRequestError(err, request, context);
};
