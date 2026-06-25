import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { ideasTable } from "./ideas";

/**
 * A 1:1 conversation between an investor and a founder about a specific idea.
 * Unique per (idea, investor) so reaching out twice reuses the same thread.
 */
export const threadsTable = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideasTable.id, { onDelete: "cascade" }),
    founderId: uuid("founder_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    investorId: uuid("investor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    uniqIdeaInvestor: unique().on(t.ideaId, t.investorId),
  }),
);

export const threadMessagesTable = pgTable("thread_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => threadsTable.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Thread = typeof threadsTable.$inferSelect;
export type ThreadMessage = typeof threadMessagesTable.$inferSelect;
