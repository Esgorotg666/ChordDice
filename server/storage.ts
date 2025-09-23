import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  type ChordProgression, 
  type InsertChordProgression,
  type Referral,
  type InsertReferral,
  users,
  chordProgressions,
  referrals
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
  
  // Referral methods
  generateReferralCode(userId: string): Promise<User | undefined>;
  getReferralStats(userId: string): Promise<{ user: User; referrals: Referral[]; totalReferred: number; totalRewardsPending: number; }>;
  applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean; message: string; }>;
  processReferralRewards(): Promise<{ processed: number; errors: string[]; }>;
  
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

  // Referral methods
  async generateReferralCode(userId: string): Promise<User | undefined> {
    // Generate a unique referral code (8 characters)
    const generateCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Try up to 5 times to generate a unique code
    for (let attempt = 0; attempt < 5; attempt++) {
      const newCode = generateCode();
      
      try {
        const [updatedUser] = await db
          .update(users)
          .set({
            referralCode: newCode,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser;
      } catch (error: any) {
        // If unique constraint violation, try again
        if (error.code === '23505' && attempt < 4) {
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Failed to generate unique referral code after 5 attempts');
  }

  async getReferralStats(userId: string): Promise<{ user: User; referrals: Referral[]; totalReferred: number; totalRewardsPending: number; }> {
    // Get user info
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all referrals made by this user
    const userReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId));

    // Count pending rewards (referrals that haven't granted rewards yet)
    const pendingRewards = userReferrals.filter(r => !r.rewardGranted).length;

    return {
      user,
      referrals: userReferrals,
      totalReferred: userReferrals.length,
      totalRewardsPending: pendingRewards,
    };
  }

  async applyReferralCode(userId: string, referralCode: string): Promise<{ success: boolean; message: string; }> {
    // Find the referrer by code
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));

    if (!referrer) {
      return { success: false, message: 'Invalid referral code' };
    }

    if (referrer.id === userId) {
      return { success: false, message: 'You cannot refer yourself' };
    }

    // Check if user already has a referrer
    const user = await this.getUser(userId);
    if (user?.referredBy) {
      return { success: false, message: 'You have already used a referral code' };
    }

    try {
      // Use atomic transaction to ensure consistency
      await db.transaction(async (tx) => {
        // Update user with referrer info
        await tx
          .update(users)
          .set({
            referredBy: referralCode,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create referral record
        await tx
          .insert(referrals)
          .values({
            referrerUserId: referrer.id,
            refereeUserId: userId,
            referralCode: referralCode,
            signupDate: new Date(),
          });
      });

      return { success: true, message: 'Referral code applied successfully!' };
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        return { success: false, message: 'You have already used a referral code' };
      }
      
      return { success: false, message: 'Failed to apply referral code' };
    }
  }

  async processReferralRewards(): Promise<{ processed: number; errors: string[]; }> {
    // This processes referral rewards for users who have subscribed
    // In a real implementation, this would be called by a webhook or scheduled job
    
    let processed = 0;
    const errors: string[] = [];

    try {
      // Find all referrals where referee has active subscription but reward not granted
      const pendingRewards = await db
        .select({
          referral: referrals,
          referee: users,
        })
        .from(referrals)
        .innerJoin(users, eq(referrals.refereeUserId, users.id))
        .where(
          and(
            eq(referrals.rewardGranted, false),
            eq(users.subscriptionStatus, 'active')
          )
        );

      for (const { referral } of pendingRewards) {
        try {
          // Use atomic transaction to claim reward and apply it
          await db.transaction(async (tx) => {
            // First, atomically claim the reward (prevents double processing)
            const [updatedReferral] = await tx
              .update(referrals)
              .set({
                rewardGranted: true,
                rewardGrantedDate: new Date(),
              })
              .where(
                and(
                  eq(referrals.id, referral.id),
                  eq(referrals.rewardGranted, false) // Only process if not already granted
                )
              )
              .returning();

            // Only proceed if we successfully claimed the reward
            if (updatedReferral) {
              // Apply the reward to the referrer within the same transaction
              // Use DB-side atomic expression to prevent race conditions on subscription expiry
              await tx
                .update(users)
                .set({
                  subscriptionStatus: 'active',
                  // Atomic expiry calculation: max(now, current_expiry) + 1 month
                  subscriptionExpiry: sql`
                    GREATEST(
                      COALESCE(${users.subscriptionExpiry}, NOW()), 
                      NOW()
                    ) + INTERVAL '1 month'
                  `,
                  referralRewardsEarned: sql`COALESCE(${users.referralRewardsEarned}, 0) + 1`,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, referral.referrerUserId));
            } else {
              // If we couldn't claim the reward, someone else already processed it
              return;
            }
          });

          processed++;
        } catch (error: any) {
          errors.push(`Failed to process reward for referral ${referral.id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Failed to fetch pending rewards: ${error.message}`);
    }

    return { processed, errors };
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
