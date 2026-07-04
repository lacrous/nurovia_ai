/**
 * Drizzle schema for Nurovia AI backend (Postgres flavor).
 *
 * Tables:
 *   - users              account records
 *   - sessions           Lucia session table
 *   - keys               Lucia key table (used for password + OAuth)
 *   - chat_sessions      user-owned chat sessions (replaces localStorage)
 *   - messages           messages within a chat session
 *   - api_keys           encrypted LLM provider API keys per user
 *   - memory_facts       cross-session memory (replaces localStorage)
 *   - personas           custom personas (replaces localStorage)
 *   - workspaces         multi-workspace (replaces localStorage)
 *   - usage_events       billing + analytics
 *   - stripe_customers   billing link
 *   - password_resets    hashed tokens for password reset (15-min TTL)
 *   - email_verifications hashed tokens for email verify (24-hr TTL)
 *   - oauth_accounts     Google + GitHub linked accounts
 *   - totp_secrets       TOTP 2FA secrets + backup codes
 *   - auth_events        audit log of every auth event
 */
import { pgTable, text, integer, boolean, timestamp, index, primaryKey, jsonb } from "drizzle-orm/pg-core";

// --- Lucia auth tables ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"), // nullable for OAuth-only users
  plan: text("plan").notNull().default("free"), // free | pro | team | enterprise
  role: text("role").notNull().default("user"), // user | admin
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  avatarUrl: text("avatar_url"),
  failedSigninCount: integer("failed_signin_count").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastSigninAt: timestamp("last_signin_at"),
  lastSigninIp: text("last_signin_ip"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const keys = pgTable("keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hashedPassword: text("hashed_password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Chat core ---

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id"),
    title: text("title").notNull().default("New debug session"),
    starred: boolean("starred").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("chat_sessions_user_idx").on(t.userId),
    updatedIdx: index("chat_sessions_updated_idx").on(t.userId, t.updatedAt),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant | system | tool
    content: text("content").notNull(),
    model: text("model"),
    provider: text("provider"),
    reaction: text("reaction"),
    parentId: text("parent_id"),
    usage: jsonb("usage"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("messages_session_idx").on(t.sessionId, t.createdAt),
  })
);

// --- Encrypted API key vault ---

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    label: text("label"),
    ciphertext: text("ciphertext").notNull(),
    last4: text("last4").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => ({
    userProviderIdx: index("api_keys_user_provider_idx").on(t.userId, t.provider),
  })
);

// --- User data ---

export const memoryFacts = pgTable(
  "memory_facts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("memory_facts_user_idx").on(t.userId),
  })
);

export const personas = pgTable(
  "personas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("✨"),
    systemPrompt: text("system_prompt").notNull(),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("personas_user_idx").on(t.userId),
  })
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("✨"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("workspaces_user_idx").on(t.userId),
  })
);

// --- Billing + analytics ---

export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    provider: text("provider"),
    model: text("model"),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    costMicros: integer("cost_micros").notNull().default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("usage_events_user_idx").on(t.userId, t.createdAt),
  })
);

export const stripeCustomers = pgTable("stripe_customers", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Auth: tokens, OAuth, audit, 2FA ---

export const passwordResets = pgTable(
  "password_resets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("password_resets_user_idx").on(t.userId, t.createdAt),
  })
);

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("email_verifications_user_idx").on(t.userId, t.createdAt),
  })
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // google | github | apple
    providerUserId: text("provider_user_id").notNull(),
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => ({
    providerIdx: index("oauth_accounts_provider_idx").on(t.provider, t.providerUserId),
    userIdx: index("oauth_accounts_user_idx").on(t.userId),
  })
);

export const totpSecrets = pgTable("totp_secrets", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  backupCodes: jsonb("backup_codes").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  enabledAt: timestamp("enabled_at"),
});

export const authEvents = pgTable(
  "auth_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    email: text("email"),
    type: text("type").notNull(),
    ip: text("ip").notNull(),
    userAgent: text("user_agent").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("auth_events_user_idx").on(t.userId, t.createdAt),
    typeIdx: index("auth_events_type_idx").on(t.type, t.createdAt),
  })
);

export const providerHealth = pgTable(
  "provider_health",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    success: boolean("success").notNull(),
    statusCode: integer("status_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    providerIdx: index("provider_health_provider_idx").on(t.provider, t.createdAt),
  })
);