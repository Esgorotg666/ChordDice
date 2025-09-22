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
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Auth methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateSubscriptionStatus(userId: string, status: string, expiry?: Date): Promise<User | undefined>;
  
  // Legacy auth methods (backward compatibility)
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
