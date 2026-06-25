import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const investorsTable = pgTable("investors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  firm: text("firm").notNull(),
  interests: text("interests").array().notNull().default([]),
  riskLevel: riskLevelEnum("risk_level").notNull().default("medium"),
  bio: text("bio").notNull(),
  contactHint: text("contact_hint").notNull(),
  // Cached embedding (JSON-serialised number[]). Null until first match request.
  embedding: text("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Investor = typeof investorsTable.$inferSelect;
