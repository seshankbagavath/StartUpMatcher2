import { pgTable, text, uuid, timestamp, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ideaStageEnum = pgEnum("idea_stage", ["idea", "mvp", "growth", "scale"]);

export const ideasTable = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  stage: ideaStageEnum("stage").notNull().default("idea"),
  evaluationScore: real("evaluation_score"),
  evaluationFeedback: text("evaluation_feedback"),
  // Sub-scores (0-25 each)
  problemClarity: real("problem_clarity"),
  marketSize: real("market_size"),
  innovationScore: real("innovation_score"),
  executionPotential: real("execution_potential"),
  // Qualitative AI output
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  suggestions: text("suggestions").array(),
  marketPotential: text("market_potential"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertIdeaSchema = createInsertSchema(ideasTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideasTable.$inferSelect;
