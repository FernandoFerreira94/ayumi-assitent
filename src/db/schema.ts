import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  smallint,
  primaryKey,
  integer,
  pgEnum,
  pgTable,
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
  address: text("address"),
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
    /** Desconto do agendamento: "pct" (value = %) ou "brl" (value = centavos). price_cents já vem descontado. */
    discountKind: text("discount_kind").$type<"pct" | "brl">(),
    discountValue: integer("discount_value"),
    discountCents: integer("discount_cents").notNull().default(0),
    /** Observação livre (ex.: motivo do desconto), até 300 caracteres */
    notes: text("notes"),
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
  /** "app" = bloqueio criado aqui; "google" = evento importado do Google Agenda (somente leitura) */
  source: text("source").notNull().default("app"),
  googleEventId: text("google_event_id"),
});

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
