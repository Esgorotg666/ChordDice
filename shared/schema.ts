import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Updated for Replit Auth and subscriptions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription fields for Stripe integration
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, active, canceled, past_due
  subscriptionExpiry: timestamp("subscription_expiry"),
  // Legacy fields (keeping for backward compatibility)
  username: text("username").unique(),
  password: text("password"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Schema for Replit Auth user upsert
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Schema for legacy user creation (backward compatibility)
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

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChordProgression = z.infer<typeof insertChordProgressionSchema>;
export type ChordProgression = typeof chordProgressions.$inferSelect;
