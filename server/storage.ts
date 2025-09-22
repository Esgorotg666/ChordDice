import { type User, type InsertUser, type ChordProgression, type InsertChordProgression } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chordProgressions: Map<string, ChordProgression>;

  constructor() {
    this.users = new Map();
    this.chordProgressions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChordProgressions(userId?: string): Promise<ChordProgression[]> {
    const progressions = Array.from(this.chordProgressions.values());
    if (userId) {
      return progressions.filter(p => p.userId === userId);
    }
    return progressions;
  }

  async getChordProgression(id: string): Promise<ChordProgression | undefined> {
    return this.chordProgressions.get(id);
  }

  async createChordProgression(insertProgression: InsertChordProgression): Promise<ChordProgression> {
    const id = randomUUID();
    const progression: ChordProgression = {
      ...insertProgression,
      id,
      userId: insertProgression.userId || null,
      colorRoll: insertProgression.colorRoll || null,
      numberRoll: insertProgression.numberRoll || null,
      isFavorite: insertProgression.isFavorite || null,
      createdAt: new Date(),
    };
    this.chordProgressions.set(id, progression);
    return progression;
  }

  async updateChordProgression(id: string, updates: Partial<ChordProgression>): Promise<ChordProgression | undefined> {
    const existing = this.chordProgressions.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.chordProgressions.set(id, updated);
    return updated;
  }

  async deleteChordProgression(id: string): Promise<boolean> {
    return this.chordProgressions.delete(id);
  }

  async getFavoriteProgressions(userId: string): Promise<ChordProgression[]> {
    return Array.from(this.chordProgressions.values()).filter(
      p => p.userId === userId && p.isFavorite === "true"
    );
  }
}

export const storage = new MemStorage();
