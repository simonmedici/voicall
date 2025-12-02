import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// BETTER AUTH TABLES
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    password: text("password"), // Hashed password for email/password auth
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex("account_provider_account_idx").on(
      table.providerId,
      table.accountId
    ),
    userIdIdx: index("account_user_id_idx").on(table.userId),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    identifierValueIdx: uniqueIndex("verification_identifier_value_idx").on(
      table.identifier,
      table.value
    ),
  })
);

// ============================================
// SUBSCRIPTION & BILLING
// ============================================

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    // Stripe Integration
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),

    // Plan & Status
    tier: text("tier").notNull().default("starter"), // starter, pro, enterprise
    status: text("status").notNull().default("active"), // active, canceled, past_due, trialing

    // Usage Tracking (Minutes)
    minutesIncluded: integer("minutes_included").notNull().default(200), // Starter 200, Pro 1000, Enterprise -1 (unlimited)
    minutesUsed: integer("minutes_used").notNull().default(0),
    minutesReset: timestamp("minutes_reset"), // Next billing cycle reset date

    // Overage Tracking
    overageMinutes: real("overage_minutes").notNull().default(0), // Minutes used beyond limit
    overageEmailSent: boolean("overage_email_sent").notNull().default(false), // 100% warning email sent
    lastOverageBilledAt: timestamp("last_overage_billed_at"), // Last time overage was charged

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("subscription_user_id_idx").on(table.userId),
    stripeCustomerIdx: index("subscription_stripe_customer_idx").on(
      table.stripeCustomerId
    ),
  })
);

// ============================================
// AGENT CONFIGURATION (Simplified - ElevenLabs Docs)
// ============================================

export const agentConfig = pgTable(
  "agent_config",
  {
    // Core Identifiers
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    elevenLabsAgentId: text("elevenlabs_agent_id").notNull(),

    // Required by ElevenLabs API
    name: text("name").notNull(),
    voiceId: text("voice_id").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    firstMessage: text("first_message").notNull(), // REQUIRED!
    language: text("language").notNull().default("en"),

    // Optional LLM Settings
    llmModel: text("llm_model").default("gpt-4o"),
    temperature: real("temperature").default(1.0),
    maxTokens: integer("max_tokens").default(-1),

    // Status
    isActive: boolean("is_active").notNull().default(true),

    // Assignment Tracking
    assignedAt: timestamp("assigned_at"), // When agent was assigned to this user

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("agent_config_user_id_idx").on(table.userId),
    agentIdIdx: index("agent_config_agent_id_idx").on(table.elevenLabsAgentId),
  })
);

// ============================================
// CALL HISTORY (ElevenLabs Data)
// ============================================

export const call = pgTable(
  "call",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // ElevenLabs IDs
    conversationId: text("conversation_id").notNull().unique(),
    agentId: text("agent_id").notNull(),

    // Call Status & Timing
    status: text("status").notNull().default("initiated"), // initiated, in-progress, done, failed
    durationSecs: integer("duration_secs"),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),

    // Transcript & Data
    transcript: jsonb("transcript"), // Full transcript array from ElevenLabs
    metadata: jsonb("metadata"), // Full metadata object from webhook
    analysis: jsonb("analysis"), // Analysis data (if available)

    // Audio
    hasAudio: boolean("has_audio").notNull().default(false),
    audioUrl: text("audio_url"),

    // Extracted Data (for n8n integration)
    extractedData: jsonb("extracted_data"), // Patient name, appointment details, etc.

    // Billing
    minutesCharged: real("minutes_charged").default(0),
    callSuccessful: boolean("call_successful").notNull().default(false),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("call_user_id_idx").on(table.userId),
    conversationIdIdx: uniqueIndex("call_conversation_id_idx").on(
      table.conversationId
    ),
    statusIdx: index("call_status_idx").on(table.status),
    createdAtIdx: index("call_created_at_idx").on(table.createdAt),
  })
);

// ============================================
// RELATIONS
// ============================================

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  subscription: one(subscription, {
    fields: [user.id],
    references: [subscription.userId],
  }),
  agentConfigs: many(agentConfig), // Changed to many for multi-agent support
  calls: many(call),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const agentConfigRelations = relations(agentConfig, ({ one }) => ({
  user: one(user, {
    fields: [agentConfig.userId],
    references: [user.id],
  }),
}));

export const callRelations = relations(call, ({ one }) => ({
  user: one(user, {
    fields: [call.userId],
    references: [user.id],
  }),
}));
