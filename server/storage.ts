import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  type ChordProgression, 
  type InsertChordProgression,
  users,
  chordProgressions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Auth methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateSubscriptionStatus(userId: string, status: string, expiry?: Date): Promise<User | undefined>;
  
  // Legacy auth methods (backward compatibility)
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Usage tracking methods
  incrementDiceRoll(userId: string): Promise<User | undefined>;
  canUseDiceRoll(userId: string): Promise<boolean>;
  addAdRollReward(userId: string): Promise<User | undefined>;
  resetDailyAds(userId: string): Promise<User | undefined>;
  
  // Chord progression methods
  getChordProgressions(userId?: string): Promise<ChordProgression[]>;
  getChordProgression(id: string): Promise<ChordProgression | undefined>;
  createChordProgression(progression: InsertChordProgression): Promise<ChordProgression>;
  updateChordProgression(id: string, updates: Partial<ChordProgression>): Promise<ChordProgression | undefined>;
  deleteChordProgression(id: string): Promise<boolean>;
  getFavoriteProgressions(userId: string): Promise<ChordProgression[]>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, status: string, expiry?: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Legacy auth methods (backward compatibility)
  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Usage tracking methods
  async canUseDiceRoll(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Premium users have unlimited rolls
    const now = new Date();
    const isActive = user.subscriptionStatus === 'active' && 
                    user.subscriptionExpiry && 
                    new Date(user.subscriptionExpiry) > now;
    
    if (isActive) return true;
    
    // Check if daily reset is needed (NULL dates need reset)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const needsReset = !user.rollsResetDate || (() => {
      const resetDate = new Date(user.rollsResetDate);
      resetDate.setHours(0, 0, 0, 0);
      return today.getTime() !== resetDate.getTime();
    })();
    
    // Free users: check base limit + extra tokens (after potential reset)
    const usedRolls = needsReset ? 0 : (user.diceRollsUsed || 0);
    const baseLimit = user.diceRollsLimit || 5;
    const extraTokens = user.extraRollTokens || 0;
    
    return usedRolls < (baseLimit + extraTokens);
  }

  async incrementDiceRoll(userId: string): Promise<User | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, try to reset daily counter if needed
    await db
      .update(users)
      .set({
        diceRollsUsed: 0,
        rollsResetDate: today,
        updatedAt: new Date(),
      })
      .where(sql`
        ${users.id} = ${userId} 
        AND (${users.rollsResetDate} IS NULL OR DATE(${users.rollsResetDate}) < DATE(${today}))
      `);
    
    // Try to use base limit roll first (atomic with conditional WHERE)
    const [baseRollResult] = await db
      .update(users)
      .set({
        diceRollsUsed: sql`COALESCE(${users.diceRollsUsed}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(sql`
        ${users.id} = ${userId} 
        AND COALESCE(${users.diceRollsUsed}, 0) < COALESCE(${users.diceRollsLimit}, 5)
      `)
      .returning();
    
    if (baseRollResult) {
      return baseRollResult;
    }
    
    // If base limit exhausted, try to use extra token (atomic with conditional WHERE)
    const [tokenRollResult] = await db
      .update(users)
      .set({
        diceRollsUsed: sql`COALESCE(${users.diceRollsUsed}, 0) + 1`,
        extraRollTokens: sql`COALESCE(${users.extraRollTokens}, 0) - 1`,
        updatedAt: new Date(),
      })
      .where(sql`
        ${users.id} = ${userId} 
        AND COALESCE(${users.diceRollsUsed}, 0) >= COALESCE(${users.diceRollsLimit}, 5)
        AND COALESCE(${users.extraRollTokens}, 0) > 0
      `)
      .returning();
    
    return tokenRollResult || undefined; // Return undefined if no rolls available
  }

  async addAdRollReward(userId: string): Promise<User | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check daily limit and grant token atomically with conditional WHERE
    const [updatedUser] = await db
      .update(users)
      .set({
        extraRollTokens: sql`COALESCE(${users.extraRollTokens}, 0) + 1`,
        adsWatchedCount: sql`
          CASE 
            WHEN ${users.adsWatchDate} IS NULL OR DATE(${users.adsWatchDate}) < DATE(${today})
            THEN 1
            ELSE COALESCE(${users.adsWatchedCount}, 0) + 1
          END
        `,
        adsWatchDate: today,
        totalAdsWatched: sql`COALESCE(${users.totalAdsWatched}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(sql`
        ${users.id} = ${userId}
        AND (
          ${users.adsWatchDate} IS NULL 
          OR DATE(${users.adsWatchDate}) < DATE(${today})
          OR COALESCE(${users.adsWatchedCount}, 0) < 5
        )
      `)
      .returning();
    
    if (!updatedUser) {
      throw new Error("Daily ad limit reached. Come back tomorrow for more free rolls.");
    }
    
    return updatedUser;
  }

  async resetDailyAds(userId: string): Promise<User | undefined> {
    // This method is for admin/maintenance use only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        adsWatchedCount: 0,
        adsWatchDate: today,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Chord progression methods
  async getChordProgressions(userId?: string): Promise<ChordProgression[]> {
    if (userId) {
      return await db.select().from(chordProgressions).where(eq(chordProgressions.userId, userId));
    }
    return await db.select().from(chordProgressions);
  }

  async getChordProgression(id: string): Promise<ChordProgression | undefined> {
    const [progression] = await db.select().from(chordProgressions).where(eq(chordProgressions.id, id));
    return progression;
  }

  async createChordProgression(insertProgression: InsertChordProgression): Promise<ChordProgression> {
    const [progression] = await db
      .insert(chordProgressions)
      .values(insertProgression)
      .returning();
    return progression;
  }

  async updateChordProgression(id: string, updates: Partial<ChordProgression>): Promise<ChordProgression | undefined> {
    const [progression] = await db
      .update(chordProgressions)
      .set(updates)
      .where(eq(chordProgressions.id, id))
      .returning();
    return progression;
  }

  async deleteChordProgression(id: string): Promise<boolean> {
    const result = await db
      .delete(chordProgressions)
      .where(eq(chordProgressions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFavoriteProgressions(userId: string): Promise<ChordProgression[]> {
    return await db
      .select()
      .from(chordProgressions)
      .where(and(eq(chordProgressions.userId, userId), eq(chordProgressions.isFavorite, "true")));
  }
}

export const storage = new DatabaseStorage();
