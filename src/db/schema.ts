import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const urls = table(
  "urls",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    shortCode: t.varchar("short_code", { length: 10 }).notNull().unique(),
    originalUrl: t.text("original_url").notNull(),
    customAlias: t.varchar("custom_alias", { length: 50 }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    expiryDate: t.timestamp("expiry_date"),
  },
  (table) => [t.uniqueIndex("short_code_idx").on(table.shortCode)]
);

// TypeScript types for type-safe database operations
export type NewUrl = typeof urls.$inferInsert;
export type Url = typeof urls.$inferSelect;
