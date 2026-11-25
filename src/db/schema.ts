import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  smallint,
  primaryKey,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  boolean,
  date,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  whatsappInstance: text("whatsapp_instance").unique(),
  /** Linha pronta do endereço do estúdio (formatAddress): convite .ics, Google e {endereco}/{mapa}. null = sem endereço */
  address: text("address"),
  /** Endereço do estúdio em campos (0054), editado em Ajustes > Endereço. CEP só com os 8 dígitos. */
  addressCep: text("address_cep"),
  addressStreet: text("address_street"),
  addressNumber: text("address_number"),
  addressComplement: text("address_complement"),
  addressDistrict: text("address_district"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  instagram: text("instagram"),
  /** Um dos BUSINESS_TYPES de features/salon/schema */
  businessType: text("business_type"),
  /** Nome da pessoa dona do salão (menu e saudação dos avisos do dia) */
  ownerName: text("owner_name"),
  /** Sem uso e fora da tela desde a 0029 (LGPD: não pedir dado sem uso). Mantidas para não perder o histórico. */
  birthDate: date("birth_date"),
  profession: text("profession"),
  /** Telefone comercial do salão em E.164 (+55...); null = ainda não salvo (a tela sugere o do WhatsApp) */
  businessPhone: text("business_phone"),
  /** Segmentos de atuação, um ou mais dos SEGMENTS de features/salon/schema */
  segments: text("segments")
    .array()
    .notNull()
    .default(sql`'{}'`),
  /** Texto do 1º aviso; null = o padrão do app */
  reminderTemplate: text("reminder_template"),
  /** Texto do 2º aviso; null = o padrão do app */
  secondReminderTemplate: text("second_reminder_template"),
  /** Texto da mensagem de agendamento confirmado; null = o padrão do app */
  bookingTemplate: text("booking_template"),
  /** {nome} nas mensagens: false = só o primeiro nome, true = o nome inteiro do contato */
  clientNameFull: boolean("client_name_full").notNull().default(false),
  /** Horas antes do horário em que sai o lembrete (1 a 72) */
  reminderHours: integer("reminder_hours").notNull().default(24),
  /** 1º aviso do WhatsApp ligado (padrão); desligado, só vale o 2º aviso */
  firstReminder: boolean("first_reminder").notNull().default(true),
  /** Avisar a cliente no WhatsApp quando a dona remarca (padrão ligado) */
  rescheduleNotice: boolean("reschedule_notice").notNull().default(true),
  /** Linha "Sessão 3 de 6 do seu pacote" nas mensagens de WhatsApp (Ajustes > Mensagens). */
  packageLine: boolean("package_line").notNull().default(true),
  /** Texto do aviso de remarcação; null = o padrão do app */
  rescheduleTemplate: text("reschedule_template"),
  /** Texto do aviso de cancelamento; null = o padrão do app */
  cancelTemplate: text("cancel_template"),
  /** SHA-256 do token do link de calendário assinado (Calendário do iPhone); null = link desligado */
  calendarTokenHash: text("calendar_token_hash").unique(),
  /** No link do calendário, título sem o nome da cliente (só o serviço) */
  calendarHideNames: boolean("calendar_hide_names").notNull().default(false),
  /** Última leitura do link pelo calendário (iPhone); null = link novo ainda não assinado */
  calendarFetchedAt: timestamp("calendar_fetched_at", { withTimezone: true }),
  /** Antigo link único do iCloud. Sem uso desde a 0061: os links ficam em icloud_calendars. */
  icloudCalendarUrl: text("icloud_calendar_url"),
  /** Última leitura do Google Agenda que deu certo (linha de status em Ajustes) */
  googleSyncedAt: timestamp("google_synced_at", { withTimezone: true }),
  /** Eventos que vieram na última leitura do Google */
  googleEventCount: integer("google_event_count"),
  /** null = ok; "reconnect" = entrar de novo no Google; "failed" = outra falha */
  googleSyncError: text("google_sync_error").$type<"reconnect" | "failed">(),
  /** Horas antes do horário do segundo aviso (para quem não respondeu); null = só um aviso */
  secondReminderHours: integer("second_reminder_hours").default(3),
  /** Antigo interruptor de valor. Sem uso: o valor agora é a chave {valor} no texto de agendamento */
  messageIncludePrice: boolean("message_include_price").notNull().default(false),
  /** Respostas automáticas por IA às mensagens da cliente (sempre ligadas desde a 0022) */
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  /** Regras da profissional para a IA (até 1000 caracteres) */
  aiRules: text("ai_rules"),
  /** Cidade e UF do salão: feriados locais e clima dos avisos do dia */
  city: text("city"),
  state: text("state"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  /** "device" = localização do celular (sempre atualizada), "manual" = cidade digitada; null = sem localização */
  goodMorning: boolean("good_morning").notNull().default(true),
  locationSource: text("location_source").$type<"device" | "manual">(),
  /** Carteira da cliente (0049): sinal sugerido em % do total ao escolher "Sinal" */
  depositPct: smallint("deposit_pct").notNull().default(30),
  /** Antecedência mínima (h) para o cancelamento virar crédito; menos que isso o sinal pode ficar para o salão */
  cancelNoticeHours: smallint("cancel_notice_hours").notNull().default(24),
  /** Cancelou em cima da hora: o sinal fica para o salão */
  lateCancelKeepsDeposit: boolean("late_cancel_keeps_deposit").notNull().default(true),
  /** Faltou: o sinal fica para o salão */
  noShowKeepsDeposit: boolean("no_show_keeps_deposit").notNull().default(true),
  /** Faltou: a sessão do pacote é consumida */
  noShowUsesSession: boolean("no_show_uses_session").notNull().default(true),
  /** Validade padrão (dias) de pacote vendido; crédito em dinheiro não vence */
  packageValidDays: smallint("package_valid_days").notNull().default(90),
  /** Chave Pix para a mensagem pedir o sinal; null = não pede */
  pixKey: text("pix_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneE164: text("phone_e164").notNull(),
    notes: text("notes"),
    email: text("email"),
    /** Excluída com histórico: nome "Cliente removida", telefone `anon:<id>`, sem contato (LGPD) */
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    /** Respondeu SAIR: não recebe mensagem automática (VOLTAR limpa) */
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.tenantId, t.phoneE164)],
);

export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull(),
  priceCents: integer("price_cents").notNull(),
  /** false = excluído (arquivado: o histórico ainda aponta para ele) */
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  color: text("color").notNull().default("lav"),
  bufferMin: integer("buffer_min").notNull().default(0),
  priceFrom: boolean("price_from").notNull().default(false),
  /** false = pausado: some do novo agendamento, os marcados continuam */
  bookable: boolean("bookable").notNull().default(true),
  showInSlots: boolean("show_in_slots").notNull().default(true),
  notes: text("notes"),
  /** Retorno aproximado em dias (ex.: unha 15); null = serviço sem retorno */
  returnDays: integer("return_days"),
});

export const appointmentStatus = pgEnum("appointment_status", [
  "pending_confirmation",
  "confirmed",
  "cancelled",
  "done",
  "no_show",
  "reschedule_requested",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    bufferMin: integer("buffer_min").notNull().default(0),
    /** ends_at + intervalo; quem calcula é o trigger do banco (o default aqui só deixa o insert omitir) */
    blockedUntil: timestamp("blocked_until", { withTimezone: true }).notNull().defaultNow(),
    priceCents: integer("price_cents").notNull(),
    status: appointmentStatus("status").notNull().default("pending_confirmation"),
    googleEventId: text("google_event_id"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    /** Quando a IA passou a conversa para a profissional (só uma vez por agendamento) */
    aiHandoffAt: timestamp("ai_handoff_at", { withTimezone: true }),
    /** Quando a cliente respondeu ao lembrete; só a primeira resposta muda o status */
    replyAt: timestamp("reply_at", { withTimezone: true }),
    /** Quando perguntamos "cancelar ou remarcar?"; enquanto vale, 1/2 respondem a essa pergunta */
    cancelAskedAt: timestamp("cancel_asked_at", { withTimezone: true }),
    /** Reforço único de confirmação já enviado */
    nudgeSentAt: timestamp("nudge_sent_at", { withTimezone: true }),
    /** Quando a dona foi avisada de que a cliente não respondeu aos avisos (uma vez por agendamento) */
    noReplyAt: timestamp("no_reply_at", { withTimezone: true }),
    /** Resposta automática guardada porque a cliente escreveu entre 21h e 6h; sai às 6h */
    pendingReply: text("pending_reply"),
    /** Aviso de remarcação pendente: pode sair a partir deste instante (o arraste espera o Desfazer); null = nada a avisar */
    rescheduleNoticeAt: timestamp("reschedule_notice_at", { withTimezone: true }),
    /** Aviso de cancelamento pendente: sai a partir daqui (depois do Desfazer); null = nada a mandar */
    cancelNoticeAt: timestamp("cancel_notice_at", { withTimezone: true }),
    /** Aviso de sinal recebido pendente: sai (e confirma o horário) a partir daqui, depois do Desfazer */
    depositNoticeAt: timestamp("deposit_notice_at", { withTimezone: true }),
    /** Mensagem de agendamento que falhou por instabilidade: o worker tenta de novo a partir daqui */
    bookingRetryAt: timestamp("booking_retry_at", { withTimezone: true }),
    /** Horário que a cliente conhece (da última mensagem); igual ao atual = não há o que avisar */
    notifiedStartsAt: timestamp("notified_starts_at", { withTimezone: true }),
    /** Desconto do agendamento: "pct" (value = %) ou "brl" (value = centavos). price_cents já vem descontado. */
    discountKind: text("discount_kind").$type<"pct" | "brl">(),
    discountValue: integer("discount_value"),
    discountCents: integer("discount_cents").notNull().default(0),
    /** Observação livre (ex.: motivo do desconto), até 300 caracteres */
    notes: text("notes"),
    /** Data prevista do retorno, gravada ao concluir (menor retorno entre os serviços); null = sem retorno */
    returnDueOn: date("return_due_on"),
    /** "Não precisa": a dona dispensou o retorno deste atendimento */
    returnSkippedAt: timestamp("return_skipped_at", { withTimezone: true }),
    /** Quando a dona marcou que a cliente pagou (antes do começo = pago adiantado); null = não marcado */
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** Forma de pagamento (opcional, só com paid_at) */
    paymentMethod: text("payment_method").$type<"pix" | "dinheiro" | "cartao">(),
    /** Pacote da cliente usado neste atendimento (migration 0051) */
    clientPackageId: uuid("client_package_id"),
    /** Promoção de desconto usada neste atendimento (migration 0054) */
    promotionId: uuid("promotion_id"),
    /** Sinal pedido à cliente ao agendar, em centavos (migration 0055); só vira caixa ao marcar recebido */
    depositRequestedCents: integer("deposit_requested_cents"),
    /** Concluído sozinho pelo sistema depois do fim (migration 0064); a dona trocar o status zera */
    autoDoneAt: timestamp("auto_done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("appointments_tenant_start").on(t.tenantId, t.startsAt)],
);

/** Serviços do atendimento, na ordem escolhida, com valor e duração do momento do agendamento. */
export const appointmentServices = pgTable(
  "appointment_services",
  {
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id),
    position: smallint("position").notNull(),
    priceCents: integer("price_cents").notNull(),
    durationMin: integer("duration_min").notNull(),
  },
  (t) => [primaryKey({ columns: [t.appointmentId, t.position] })],
);

export const blocks = pgTable("blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
  /** "app" = bloqueio criado aqui; "google"/"icloud" = evento importado (somente leitura) */
  source: text("source").notNull().default("app"),
  googleEventId: text("google_event_id"),
  /** UID do evento do iCloud (com o início, nas repetições). */
  externalUid: text("external_uid"),
  /** Evento de fora que virou atendimento: escondido e não ocupa mais o horário. */
  convertedAt: timestamp("converted_at", { withTimezone: true }),
  /** Calendário do iCloud de onde veio (cada calendário só refaz os seus). */
  icloudCalendarId: uuid("icloud_calendar_id").references(() => icloudCalendars.id, { onDelete: "cascade" }),
});

/** Calendários do iCloud lidos pelo link público (um por calendário: Pessoal, Trabalho…). Link nunca vai para a tela. */
export const icloudCalendars = pgTable(
  "icloud_calendars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    /** Nome lido do próprio calendário (X-WR-CALNAME) */
    name: text("name"),
    eventCount: integer("event_count").notNull().default(0),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    /** null = ok; senão o tipo do erro da última leitura */
    syncError: text("sync_error").$type<"not_found" | "failed" | "too_big" | "not_calendar">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("icloud_calendars_tenant_id_url_key").on(t.tenantId, t.url)],
);

export const workingHours = pgTable(
  "working_hours",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
    opens: text("opens").notNull(),
    closes: text("closes").notNull(),
    /** Pausa fixa do dia (HH:MM); as duas nulas = sem pausa. */
    breakStart: text("break_start"),
    breakEnd: text("break_end"),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.weekday] })],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Conversa com a cliente pelo WhatsApp: o que o app mandou e o que chegou pelo webhook. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    /** "out" | "in" */
    direction: text("direction").notNull(),
    /** MessageKind de features/messaging/store */
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    /** Intent de features/messaging/replies (resposta 1/2/3 ao lembrete) */
    intent: text("intent"),
    /** Id da mensagem no WhatsApp: barra o webhook repetido e o eco do próprio envio */
    externalId: text("external_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.tenantId, t.externalId), index("messages_client_created").on(t.clientId, t.createdAt)],
);

/** Possível resposta a uma pergunta do sistema que ele não entendeu (migration 0057). Só o painel do dono lê. */
export const unclearReplies = pgTable(
  "unclear_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    question: text("question").notNull().$type<"reminder" | "ambiguous">(),
    body: text("body").notNull(),
    aiIntent: text("ai_intent"),
    aiConfidence: real("ai_confidence"),
    decision: text("decision").notNull().$type<"alerted" | "silent" | "guess" | "ambiguous">(),
    label: text("label").$type<"confirm" | "cancel" | "reschedule" | "late" | "question" | "other">(),
    labeledAt: timestamp("labeled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("unclear_replies_created").on(t.createdAt), index("unclear_replies_client").on(t.clientId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    /** Dia do gasto (YYYY-MM-DD, calendário do estúdio) */
    spentOn: date("spent_on", { mode: "string" }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    /** Um dos EXPENSE_CATEGORIES de features/finance/expenses */
    category: text("category").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("expenses_tenant_spent").on(t.tenantId, t.spentOn)],
);

/** Listas de vagas salvas (Vagas > Personalizada): nome + filtros, para reutilizar. */
export const slotLists = pgTable(
  "slot_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** CustomConfig de features/hours/custom-slots (validada com zod ao ler e ao gravar) */
    config: jsonb("config").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.tenantId, t.name)],
);

/** Avisos do dia no celular da profissional: um por tipo e dia (o worker não repete). */
export const ownerNotices = pgTable(
  "owner_notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().$type<"day_off" | "morning" | "day_end" | "week" | "holiday" | "good_morning">(),
    day: date("day", { mode: "string" }).notNull(),
    variant: smallint("variant").notNull().default(0),
    title: text("title").notNull(),
    body: text("body").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.tenantId, t.kind, t.day)],
);

/**
 * Chaves pessoais da API (Siri e Atalhos do iPhone). Só o hash fica aqui; `last4` identifica na tela.
 * Fase 1: escopo `read` (consulta a agenda). Desligada = `revoked_at` preenchido.
 */
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  scope: text("scope").notNull().default("read").$type<"read">(),
  last4: text("last4").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  /** Preenchido = código de pareamento ainda não trocado (não vale como chave). */
  pairingExpiresAt: timestamp("pairing_expires_at", { withTimezone: true }),
});

/**
 * Extrato da carteira da cliente (0049): só inserção. Correção = linha do mesmo tipo com valor negativo e
 * `reversesId`. Regras de saldo em features/wallet/rules.ts.
 */
export const clientLedger = pgTable(
  "client_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull(),
    appointmentId: uuid("appointment_id"),
    kind: text("kind")
      .notNull()
      .$type<
        | "payment"
        | "refund"
        | "credit_in"
        | "credit_use"
        | "retained"
        | "expire"
        | "session_grant"
        | "session_reserve"
        | "session_use"
        | "session_return"
      >(),
    amountCents: integer("amount_cents").notNull().default(0),
    sessions: integer("sessions").notNull().default(0),
    method: text("method").$type<"pix" | "dinheiro" | "cartao">(),
    reason: text("reason"),
    reversesId: uuid("reverses_id"),
    clientPackageId: uuid("client_package_id"),
    createdBy: text("created_by"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("client_ledger_client").on(t.tenantId, t.clientId, t.occurredAt)],
);

/** Modelos de pacote do salão (0051): "Pague X, leve Y" e "Pacote de sessões". */
export const packageTemplates = pgTable("package_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().$type<"pay_x" | "sessions">(),
  name: text("name").notNull(),
  serviceId: uuid("service_id").notNull(),
  sessionsPaid: smallint("sessions_paid"),
  sessionsTotal: smallint("sessions_total").notNull(),
  priceCents: integer("price_cents").notNull(),
  validDays: smallint("valid_days"),
  /** 0052: período de venda e "as N primeiras clientes" (null = sem) */
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  maxClients: smallint("max_clients"),
  /** 0052: serviços em que a sessão vale (inclui serviceId, o de referência do preço) */
  serviceIds: uuid("service_ids").array().notNull(),
  active: boolean("active").notNull().default(true),
  /** 0054: venda pausada (continua na lista) */
  paused: boolean("paused").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Promoção de desconto no agendamento (0054): % ou R$ nos serviços, período e "as N primeiras" opcionais. */
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name"),
  discountKind: text("discount_kind").notNull().$type<"pct" | "brl">(),
  discountValue: integer("discount_value").notNull(),
  serviceIds: uuid("service_ids").array().notNull(),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  maxClients: smallint("max_clients"),
  paused: boolean("paused").notNull().default(false),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  /** excluída pela dona depois de usada: some da lista e para de valer; a linha fica para o histórico (0062) */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Pacote vendido para uma cliente (0051): cópia do modelo; as sessões estão no extrato. */
export const clientPackages = pgTable("client_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull(),
  templateId: uuid("template_id"),
  name: text("name").notNull(),
  serviceId: uuid("service_id").notNull(),
  serviceIds: uuid("service_ids").array().notNull(),
  sessionsTotal: smallint("sessions_total").notNull(),
  priceCents: integer("price_cents").notNull(),
  soldOn: date("sold_on", { mode: "string" }).notNull(),
  expiresOn: date("expires_on", { mode: "string" }),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
