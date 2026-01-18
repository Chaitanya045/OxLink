import { relations } from "drizzle-orm";
import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const urls = table(
  "urls",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    shortCode: t.varchar("short_code", { length: 10 }).notNull(),
    originalUrl: t.text("original_url").notNull(),
    customAlias: t.varchar("custom_alias", { length: 50 }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    expiryDate: t.timestamp("expiry_date"),
    version: t.integer("version").default(1).notNull(),
    isLatest: t.boolean("is_latest").default(true).notNull(),
    createdBy: t
      .text("created_by")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    t.uniqueIndex("short_code_version_idx").on(table.shortCode, table.version),
  ]
);

export const urlClicks = table(
  "url_clicks",
  {
    id: t
      .bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    urlId: t
      .integer("url_id")
      .notNull()
      .references(() => urls.id),

    clickedAt: t.timestamp("clicked_at").defaultNow().notNull(),

    ipAddress: t.varchar("ip_address", { length: 45 }), // IPv4 + IPv6

    userAgent: t.text("user_agent"),
    shortCode: t
      .varchar("short_code", { length: 10 })
      .notNull(),

    referrer: t.text("referrer"),

    country: t.varchar("country", { length: 2 }), // ISO: IN, US
    region: t.varchar("region", { length: 50 }),
    city: t.varchar("city", { length: 50 }),

    deviceType: t.varchar("device_type", { length: 20 }), // mobile / desktop
    os: t.varchar("os", { length: 50 }),
    browser: t.varchar("browser", { length: 50 }),

    isBot: t.boolean("is_bot").default(false).notNull(),
  },
  (table) => [
    t.index("url_clicks_url_id_idx").on(table.urlId),
    t.index("url_clicks_clicked_at_idx").on(table.clickedAt),
    t.index("url_clicks_short_code_idx").on(table.shortCode),
  ]
);

export const user = table("user", {
  id: t.text("id").primaryKey(),
  name: t.text("name").notNull(),
  email: t.text("email").notNull().unique(),
  emailVerified: t.boolean("email_verified").default(false).notNull(),
  image: t.text("image"),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = table(
  "session",
  {
    id: t.text("id").primaryKey(),
    expiresAt: t.timestamp("expires_at").notNull(),
    token: t.text("token").notNull().unique(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [t.index("session_userId_idx").on(table.userId)]
);

export const account = table(
  "account",
  {
    id: t.text("id").primaryKey(),
    accountId: t.text("account_id").notNull(),
    providerId: t.text("provider_id").notNull(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: t.text("access_token"),
    refreshToken: t.text("refresh_token"),
    idToken: t.text("id_token"),
    accessTokenExpiresAt: t.timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at"),
    scope: t.text("scope"),
    password: t.text("password"),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [t.index("account_userId_idx").on(table.userId)]
);

export const verification = table(
  "verification",
  {
    id: t.text("id").primaryKey(),
    identifier: t.text("identifier").notNull(),
    value: t.text("value").notNull(),
    expiresAt: t.timestamp("expires_at").notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [t.index("verification_identifier_idx").on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// TypeScript types for type-safe database operations
export type NewUrl = typeof urls.$inferInsert;
export type Url = typeof urls.$inferSelect;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
export type UrlClicks = typeof urlClicks.$inferSelect;
export type NewUrlClicks = typeof urlClicks.$inferInsert;
