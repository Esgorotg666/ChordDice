import { 
  type User, 
  type RegisterUser,
  type ChordProgression, 
  type InsertChordProgression,
  type Referral,
  type InsertReferral,
  type ChatMessage,
  type InsertChatMessage,
  users,
  chordProgressions,
  referrals,
  chatMessages
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, sql, desc, lt } from "drizzle-orm";

export interface IStorage {
  // Custom auth methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<User | undefined>;
  verifyEmailWithToken(token: string): Promise<User | undefined>;
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<User | undefined>;
  resetPasswordWithToken(token: string, hashedPassword: string): Promise<User | undefined>;
  upsertUser(userData: Partial<User>): Promise<User>;
  
  // Subscription methods
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateSubscriptionStatus(userId: string, status: string, expiry?: Date): Promise<User | undefined>;
  
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
  
  // Chat message methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(roomId: string, limit?: number, before?: Date): Promise<Array<ChatMessage & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'> }>>;
  deleteChatMessage(messageId: string, userId: string): Promise<boolean>;
  
  // Account deletion method
  deleteUserCascade(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Custom auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(userData.id!);
    
    if (existingUser) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    } else {
      // Create new user with default values for custom auth
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id!,
          email: userData.email || '',
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          // Default values for custom auth fields
          username: userData.email?.split('@')[0] || userData.id!, // Use email prefix as username
          password: '', // Empty password for OAuth users
          authProvider: 'replit', // OAuth users from Replit
          isEmailVerified: true, // OAuth users are pre-verified
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user;
    }
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async verifyEmailWithToken(token: string): Promise<User | undefined> {
    if (!token) return undefined;
    const [user] = await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.emailVerificationToken, token),
        sql`${users.emailVerificationExpiry} > NOW()`
      ))
      .returning();
    return user;
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async resetPasswordWithToken(token: string, hashedPassword: string): Promise<User | undefined> {
    if (!token) return undefined;
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.passwordResetToken, token),
        sql`${users.passwordResetExpiry} > NOW()`
      ))
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


  // Usage tracking methods
  async canUseDiceRoll(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Test users have unlimited access - bypass all restrictions
    if (user.isTestUser) return true;
    
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
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Test users get unlimited access - just update timestamp without restrictions
    if (user.isTestUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    
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
                .where(eq(users.id, referral.referrerUserId!));
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

  // Chat message methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return chatMessage;
  }

  async getChatHistory(roomId: string, limit: number = 50, before?: Date): Promise<Array<ChatMessage & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'> }>> {
    const query = db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        userId: chatMessages.userId,
        content: chatMessages.content,
        audioUrl: chatMessages.audioUrl,
        audioDurationSec: chatMessages.audioDurationSec,
        mimeType: chatMessages.mimeType,
        createdAt: chatMessages.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(
        before 
          ? and(eq(chatMessages.roomId, roomId), lt(chatMessages.createdAt, before))
          : eq(chatMessages.roomId, roomId)
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return await query;
  }

  async deleteChatMessage(messageId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteUserCascade(userId: string): Promise<boolean> {
    try {
      let audioFilesToDelete: string[] = [];

      await db.transaction(async (tx) => {
        // First, collect any audio files that need to be deleted
        const userChatMessages = await tx
          .select({ audioUrl: chatMessages.audioUrl })
          .from(chatMessages)
          .where(and(eq(chatMessages.userId, userId), sql`${chatMessages.audioUrl} IS NOT NULL`));
        
        audioFilesToDelete = userChatMessages
          .map(msg => msg.audioUrl)
          .filter(url => url) as string[];

        // Delete related data in proper order to avoid foreign key violations
        
        // Delete chat messages
        await tx
          .delete(chatMessages)
          .where(eq(chatMessages.userId, userId));

        // Delete chord progressions
        await tx
          .delete(chordProgressions)
          .where(eq(chordProgressions.userId, userId));

        // Delete referrals where user is either referrer or referee
        await tx
          .delete(referrals)
          .where(
            sql`${referrals.referrerUserId} = ${userId} OR ${referrals.refereeUserId} = ${userId}`
          );

        // Delete session data using SQL for JSON search
        await tx.execute(
          sql`DELETE FROM sessions WHERE sess->'user'->>'id' = ${userId}`
        );

        // Finally, delete the user
        const userResult = await tx
          .delete(users)
          .where(eq(users.id, userId));

        if ((userResult.rowCount ?? 0) === 0) {
          throw new Error('User not found or already deleted');
        }
      });

      // After successful transaction, clean up audio files
      if (audioFilesToDelete.length > 0) {
        const { unlink } = await import('fs/promises');
        const path = await import('path');
        
        for (const audioUrl of audioFilesToDelete) {
          try {
            // Extract filename from URL and construct full path
            const filename = audioUrl.split('/').pop();
            if (filename) {
              const filePath = path.join(process.cwd(), 'uploads', 'chat', filename);
              await unlink(filePath);
            }
          } catch (fileError) {
            // Log but don't fail the entire operation for file cleanup errors
            console.warn(`Failed to delete audio file ${audioUrl}:`, fileError);
          }
        }
      }

      return true;
    } catch (error: any) {
      console.error('Failed to delete user cascade:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
