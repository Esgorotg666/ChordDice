import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChordProgressionSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Check subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const now = new Date();
      const isActive = user?.subscriptionStatus === 'active' && 
                     user?.subscriptionExpiry && 
                     new Date(user.subscriptionExpiry) > now;
      
      res.json({
        hasActiveSubscription: isActive,
        subscriptionStatus: user?.subscriptionStatus || 'free',
        subscriptionExpiry: user?.subscriptionExpiry
      });
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Failed to check subscription status" });
    }
  });

  // Usage tracking routes
  app.get('/api/usage/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const canRoll = await storage.canUseDiceRoll(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate day-aware values (NULL dates need reset)
      const needsDiceReset = !user.rollsResetDate || (() => {
        const rollResetDate = new Date(user.rollsResetDate);
        rollResetDate.setHours(0, 0, 0, 0);
        return today.getTime() !== rollResetDate.getTime();
      })();
      
      const needsAdReset = !user.adsWatchDate || (() => {
        const adsWatchDate = new Date(user.adsWatchDate);
        adsWatchDate.setHours(0, 0, 0, 0);
        return today.getTime() !== adsWatchDate.getTime();
      })();
      
      const baseLimit = user.diceRollsLimit || 5;
      const effectiveUsedRolls = needsDiceReset ? 0 : (user.diceRollsUsed || 0);
      const extraTokens = user.extraRollTokens || 0;
      const totalAvailable = baseLimit + extraTokens;
      const effectiveAdsWatched = needsAdReset ? 0 : (user.adsWatchedCount || 0);
      
      res.json({
        diceRollsUsed: effectiveUsedRolls,
        diceRollsLimit: baseLimit,
        extraRollTokens: extraTokens,
        totalAvailableRolls: totalAvailable,
        remainingRolls: Math.max(0, totalAvailable - effectiveUsedRolls),
        adsWatchedCount: effectiveAdsWatched,
        canUseDiceRoll: canRoll
      });
    } catch (error) {
      console.error("Error checking usage status:", error);
      res.status(500).json({ message: "Failed to check usage status" });
    }
  });

  app.post('/api/usage/increment-dice-roll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const canRoll = await storage.canUseDiceRoll(userId);
      
      if (!canRoll) {
        return res.status(403).json({ 
          message: "Dice roll limit reached. Watch an ad or upgrade to premium for unlimited rolls.",
          limitReached: true
        });
      }
      
      const updatedUser = await storage.incrementDiceRoll(userId);
      
      if (!updatedUser) {
        return res.status(403).json({ 
          message: "Dice roll limit reached. Watch an ad or upgrade to premium for unlimited rolls.",
          limitReached: true
        });
      }
      
      const baseLimit = updatedUser.diceRollsLimit || 5;
      const usedRolls = updatedUser.diceRollsUsed || 0;
      const extraTokens = updatedUser.extraRollTokens || 0;
      const totalAvailable = baseLimit + extraTokens;
      
      res.json({
        diceRollsUsed: usedRolls,
        diceRollsLimit: baseLimit,
        extraRollTokens: extraTokens,
        remainingRolls: Math.max(0, totalAvailable - usedRolls)
      });
    } catch (error) {
      console.error("Error incrementing dice roll:", error);
      res.status(500).json({ message: "Failed to increment dice roll" });
    }
  });

  app.post('/api/usage/watch-ad-reward', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const updatedUser = await storage.addAdRollReward(userId);
      
      res.json({
        extraRollTokens: updatedUser?.extraRollTokens || 0,
        adsWatchedCount: updatedUser?.adsWatchedCount || 0,
        totalAdsWatched: updatedUser?.totalAdsWatched || 0,
        message: "Thanks for watching! You earned 1 extra riff generation."
      });
    } catch (error) {
      console.error("Error processing ad reward:", error);
      if (error instanceof Error && error.message.includes('Daily ad limit reached')) {
        return res.status(403).json({ 
          message: error.message,
          dailyLimitReached: true
        });
      }
      res.status(500).json({ message: "Failed to process ad reward" });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    let user = req.user;
    const userId = user.claims.sub;
    const dbUser = await storage.getUser(userId);

    if (dbUser?.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);

      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
      return;
    }
    
    if (!user.claims.email) {
      throw new Error('No user email on file');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.claims.email,
        name: `${user.claims.first_name || ''} ${user.claims.last_name || ''}`.trim(),
      });

      // You'll need to create a price in Stripe dashboard first
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          // This would be your premium plan price ID from Stripe
          price: 'price_1234567890', // Replace with your actual price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);
      
      // Update subscription status
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Monthly subscription
      await storage.updateSubscriptionStatus(userId, 'active', expiryDate);
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });
  // Chord progression routes
  app.get("/api/chord-progressions", async (req, res) => {
    try {
      const { userId } = req.query;
      const progressions = await storage.getChordProgressions(userId as string);
      res.json(progressions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chord progressions" });
    }
  });

  app.post("/api/chord-progressions", async (req, res) => {
    try {
      const validatedData = insertChordProgressionSchema.parse(req.body);
      const progression = await storage.createChordProgression(validatedData);
      res.status(201).json(progression);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid chord progression data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create chord progression" });
      }
    }
  });

  app.get("/api/chord-progressions/:id", async (req, res) => {
    try {
      const progression = await storage.getChordProgression(req.params.id);
      if (!progression) {
        return res.status(404).json({ message: "Chord progression not found" });
      }
      res.json(progression);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chord progression" });
    }
  });

  app.put("/api/chord-progressions/:id", async (req, res) => {
    try {
      const updates = req.body;
      const progression = await storage.updateChordProgression(req.params.id, updates);
      if (!progression) {
        return res.status(404).json({ message: "Chord progression not found" });
      }
      res.json(progression);
    } catch (error) {
      res.status(500).json({ message: "Failed to update chord progression" });
    }
  });

  app.delete("/api/chord-progressions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChordProgression(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Chord progression not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chord progression" });
    }
  });

  app.get("/api/chord-progressions/favorites/:userId", async (req, res) => {
    try {
      const progressions = await storage.getFavoriteProgressions(req.params.userId);
      res.json(progressions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorite progressions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
