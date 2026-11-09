-- Eventos que já existem no Google Agenda entram na agenda como horário ocupado, somente leitura.
ALTER TABLE blocks
  ADD COLUMN source text NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'google')),
  ADD COLUMN google_event_id text;
CREATE UNIQUE INDEX blocks_tenant_google_event ON blocks (tenant_id, google_event_id) WHERE google_event_id IS NOT NULL;
