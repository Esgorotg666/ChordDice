import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chordProgressions = pgTable("chord_progressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // 'single' or 'riff'
  chords: jsonb("chords").notNull(), // Array of chord strings
  colorRoll: text("color_roll"),
  numberRoll: text("number_roll"),
  isFavorite: text("is_favorite").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChordProgressionSchema = createInsertSchema(chordProgressions).pick({
  userId: true,
  type: true,
  chords: true,
  colorRoll: true,
  numberRoll: true,
  isFavorite: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChordProgression = z.infer<typeof insertChordProgressionSchema>;
export type ChordProgression = typeof chordProgressions.$inferSelect;
