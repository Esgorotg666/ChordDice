import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, index, boolean, integer } from "drizzle-orm/pg-core";
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
  // Freemium usage tracking
  diceRollsUsed: integer("dice_rolls_used").default(0),
  diceRollsLimit: integer("dice_rolls_limit").default(5), // Base limit, never increased
  rollsResetDate: timestamp("rolls_reset_date").defaultNow(),
  // Token-based ad system (daily reset)
  extraRollTokens: integer("extra_roll_tokens").default(0), // Consumable tokens from ads
  adsWatchedCount: integer("ads_watched_count").default(0), // Daily count (resets)
  adsWatchDate: timestamp("ads_watch_date").defaultNow(), // Date for daily reset tracking
  totalAdsWatched: integer("total_ads_watched").default(0), // Historical total
  // Referral system
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: varchar("referred_by", { length: 20 }),
  referralRewardsEarned: integer("referral_rewards_earned").default(0),
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

// Referral tracking table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerUserId: varchar("referrer_user_id").references(() => users.id),
  refereeUserId: varchar("referee_user_id").references(() => users.id),
  referralCode: varchar("referral_code", { length: 20 }).notNull(),
  signupDate: timestamp("signup_date").defaultNow(),
  subscriptionDate: timestamp("subscription_date"),
  trialCompleted: boolean("trial_completed").default(false),
  rewardGranted: boolean("reward_granted").default(false),
  rewardGrantedDate: timestamp("reward_granted_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().default("public"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content"), // nullable for audio-only messages
  audioUrl: varchar("audio_url"), // nullable, relative path to audio file
  audioDurationSec: integer("audio_duration_sec"), // nullable, for validation
  mimeType: varchar("mime_type"), // nullable, for audio messages
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_chat_messages_room_created").on(table.roomId, table.createdAt),
  index("IDX_chat_messages_user").on(table.userId),
]);

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

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerUserId: true,
  refereeUserId: true,
  referralCode: true,
  subscriptionDate: true,
  trialCompleted: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  roomId: true,
  userId: true,
  content: true,
  audioUrl: true,
  audioDurationSec: true,
  mimeType: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChordProgression = z.infer<typeof insertChordProgressionSchema>;
export type ChordProgression = typeof chordProgressions.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
