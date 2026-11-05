import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { errInfo, log } from "@/lib/log";

export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // sem DSN o Sentry fica desligado
  Sentry.init({
    dsn,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Todo erro de requisição do servidor vira log estruturado e, com DSN, vai ao Sentry.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  log("error", "request_error", { path: request.path, route: context.routePath, ...errInfo(err) });
  Sentry.captureRequestError(err, request, context);
};
