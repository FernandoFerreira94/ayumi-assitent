import * as Sentry from "@sentry/nextjs";
import { redactUrl } from "@/lib/log";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
// Mesmo cuidado do servidor: URL sem token nem id de cliente, e nada de dado digitado pela dona
if (dsn)
  Sentry.init({
    dsn,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      if (event.request?.url) event.request.url = redactUrl(event.request.url);
      if (event.transaction) event.transaction = redactUrl(event.transaction);
      return event;
    },
    beforeBreadcrumb(b) {
      const data = b.data as Record<string, unknown> | undefined;
      if (data) for (const [k, v] of Object.entries(data)) if (typeof v === "string") data[k] = redactUrl(v);
      // Texto de botão/campo clicado pode ter nome de cliente
      if (b.category === "ui.click" || b.category === "ui.input") b.message = undefined;
      return b;
    },
  });

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : undefined;
