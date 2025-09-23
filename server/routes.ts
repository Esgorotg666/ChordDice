import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertChordProgressionSchema } from "@shared/schema";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { createRateLimitMiddleware, mutationRateLimiter, referralRateLimiter, socketConnectionLimiter, socketEventLimiter } from "./middleware/rateLimiter";
import { csrfProtection } from "./middleware/csrfProtection";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import { parseBuffer } from "music-metadata";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import express from "express";
import DOMPurify from "isomorphic-dompurify";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Strict whitelist of allowed audio MIME types
    const allowedMimeTypes = [
      'audio/mpeg',       // MP3
      'audio/wav',        // WAV
      'audio/ogg',        // OGG
      'audio/mp4',        // M4A
      'audio/aac',        // AAC
      'audio/flac',       // FLAC
      'audio/x-wav',      // Alternative WAV
      'audio/x-mpeg',     // Alternative MP3
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`File type ${file.mimetype} not allowed. Only audio files are permitted.`) as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
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

  app.post('/api/usage/increment-dice-roll', 
    isAuthenticated, 
    csrfProtection,
    createRateLimitMiddleware(mutationRateLimiter, "dice roll"), 
    async (req: any, res) => {
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

  // TEMPORARILY DISABLED: Ad endpoint has security vulnerability
  // TODO: Implement proper ad verification with third-party SDK attestation before re-enabling
  app.post('/api/usage/watch-ad-reward', isAuthenticated, csrfProtection, async (req: any, res) => {
    res.status(503).json({ 
      message: "Ad system temporarily disabled for security improvements. Please upgrade to Premium for unlimited generations.",
      success: false,
      temporarilyDisabled: true
    });
  });

  // Referral routes
  app.get('/api/referrals/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      
      res.json({
        referralCode: stats.user.referralCode,
        referrals: stats.referrals,
        totalReferred: stats.totalReferred,
        totalRewardsPending: stats.totalRewardsPending,
        referralRewardsEarned: stats.user.referralRewardsEarned || 0
      });
    } catch (error) {
      console.error("Error fetching referral dashboard:", error);
      res.status(500).json({ message: "Failed to fetch referral dashboard" });
    }
  });

  app.post('/api/referrals/generate-code', 
    isAuthenticated, 
    csrfProtection,
    createRateLimitMiddleware(referralRateLimiter, "generate referral code"), 
    async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.referralCode) {
        return res.json({ 
          referralCode: user.referralCode,
          message: "You already have a referral code" 
        });
      }
      
      const updatedUser = await storage.generateReferralCode(userId);
      
      if (!updatedUser?.referralCode) {
        return res.status(500).json({ message: "Failed to generate referral code" });
      }
      
      res.json({
        referralCode: updatedUser.referralCode,
        message: "Referral code generated successfully!"
      });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  app.post('/api/referrals/apply', 
    isAuthenticated, 
    csrfProtection,
    createRateLimitMiddleware(referralRateLimiter, "referral apply"), 
    async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const applyReferralSchema = z.object({
        referralCode: z.string().min(1, "Referral code is required").max(20, "Referral code too long")
      });
      
      const validatedData = applyReferralSchema.parse(req.body);
      
      const result = await storage.applyReferralCode(userId, validatedData.referralCode.toUpperCase());
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({ 
        message: result.message,
        success: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid referral code", 
          errors: error.errors 
        });
      }
      console.error("Error applying referral code:", error);
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

  // NOTE: Reward processing should be triggered by Stripe webhooks or protected cron jobs
  // This endpoint is removed for security - referral rewards will be processed automatically

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, csrfProtection, async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    let user = req.user;
    const userId = user.claims.sub;
    const dbUser = await storage.getUser(userId);

    if (dbUser?.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);
      
      const latestInvoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
      const paymentIntent = latestInvoice && typeof (latestInvoice as any).payment_intent === 'object' ? (latestInvoice as any).payment_intent : null;

      res.send({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
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
      
      const latestInvoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
      const paymentIntent = latestInvoice && typeof (latestInvoice as any).payment_intent === 'object' ? (latestInvoice as any).payment_intent : null;
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
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

  app.post("/api/chord-progressions", csrfProtection, async (req, res) => {
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

  // Serve static audio files
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res, path) => {
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    }
  }));

  // Chat endpoints
  app.get('/api/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const roomId = req.query.room || 'public';
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? new Date(req.query.before as string) : undefined;
      
      const messages = await storage.getChatHistory(roomId, limit, before);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Handle unsupported methods for chat history endpoint
  app.all('/api/chat/history', (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        message: `Method ${req.method} not allowed`,
        allowedMethods: ['GET']
      });
    }
  });

  app.post('/api/chat/upload-audio', 
    isAuthenticated,
    csrfProtection,
    createRateLimitMiddleware(mutationRateLimiter, "audio upload"),
    upload.single('audio'),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No audio file provided" });
        }

        const userId = req.user.claims.sub;
        const roomId = req.body.roomId || 'public';

        // Validate audio duration using music-metadata
        const metadata = await parseBuffer(req.file.buffer, req.file.mimetype);
        const duration = metadata.format.duration;

        if (!duration || duration > 30) {
          return res.status(400).json({ 
            message: "Audio file must be 30 seconds or less",
            maxDuration: 30,
            fileDuration: duration 
          });
        }

        // Generate secure filename with whitelisted extensions
        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
        const originalExtension = path.extname(req.file.originalname).toLowerCase();
        const safeExtension = allowedExtensions.includes(originalExtension) ? originalExtension : '.mp3';
        
        const filename = `${randomUUID()}${safeExtension}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'chat');
        const filePath = path.join(uploadDir, filename);
        
        // Ensure upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Validate that final path is within expected directory (prevent path traversal)
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!resolvedPath.startsWith(resolvedUploadDir)) {
          return res.status(400).json({ message: "Invalid file path" });
        }

        // Save file to disk
        await fs.writeFile(resolvedPath, req.file.buffer);

        // Create chat message with audio
        const chatMessage = await storage.createChatMessage({
          roomId,
          userId,
          content: null, // Audio-only message
          audioUrl: `/uploads/chat/${filename}`,
          audioDurationSec: Math.round(duration),
          mimeType: req.file.mimetype
        });

        const messageWithUser = {
          ...chatMessage,
          user: {
            id: req.user.claims.sub,
            firstName: req.user.claims.first_name || 'Unknown',
            lastName: req.user.claims.last_name || '',
            profileImageUrl: req.user.claims.profile_image_url
          }
        };

        // Broadcast to all users in the room via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(roomId).emit('chat:message', messageWithUser);
        }

        res.json({
          message: "Audio uploaded successfully",
          chatMessage: messageWithUser
        });

      } catch (error) {
        console.error("Error uploading audio:", error);
        res.status(500).json({ message: "Failed to upload audio file" });
      }
    }
  );

  app.post('/api/chat/message', 
    isAuthenticated,
    csrfProtection,
    createRateLimitMiddleware(mutationRateLimiter, "chat message"),
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        
        // Validate request body
        const messageSchema = z.object({
          roomId: z.string().default('public'),
          content: z.string().min(1, "Message content is required").max(1000, "Message too long")
        });
        
        const validatedData = messageSchema.parse(req.body);
        
        // Sanitize content to prevent XSS attacks
        const sanitizedContent = DOMPurify.sanitize(validatedData.content, { 
          ALLOWED_TAGS: [], // Strip all HTML tags
          ALLOWED_ATTR: [] // Strip all attributes
        });
        
        const chatMessage = await storage.createChatMessage({
          roomId: validatedData.roomId,
          userId,
          content: sanitizedContent,
          audioUrl: null,
          audioDurationSec: null,
          mimeType: null
        });

        const messageWithUser = {
          ...chatMessage,
          user: {
            id: req.user.claims.sub,
            firstName: req.user.claims.first_name || 'Unknown',
            lastName: req.user.claims.last_name || '',
            profileImageUrl: req.user.claims.profile_image_url
          }
        };

        // Broadcast to all users in the room via Socket.IO
        const io = req.app.get('io');
        if (io) {
          io.to(validatedData.roomId).emit('chat:message', messageWithUser);
        }

        res.json({
          message: "Message sent successfully",
          chatMessage: messageWithUser
        });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid message data", 
            errors: error.errors 
          });
        }
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  );

  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? ["http://localhost:5000", "http://127.0.0.1:5000"] 
        : [], // Empty array in production for same-origin only
      methods: ["GET", "POST"],
      credentials: true // Allow cookies for session authentication
    }
  });

  // Socket.IO authentication middleware using session cookies
  const sessionMiddleware = getSession();
  io.engine.use((req: any, res: any, next: any) => {
    sessionMiddleware(req, res, next);
  });

  io.use(async (socket, next) => {
    try {
      const req = socket.request as any;
      
      // Rate limit Socket.IO connections to prevent DoS attacks
      const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
      if (!socketConnectionLimiter.isAllowed(clientIP)) {
        return next(new Error('Too many connection attempts. Please try again later.'));
      }
      
      // Check if user is authenticated via session (same as REST API)
      if (!req.session || !req.session.passport || !req.session.passport.user) {
        return next(new Error('Authentication required'));
      }

      const sessionUser = req.session.passport.user;
      if (!sessionUser.claims || !sessionUser.claims.sub) {
        return next(new Error('Invalid session'));
      }

      const userId = sessionUser.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user info to socket (using session claims like REST API)
      socket.data.user = {
        id: userId,
        firstName: sessionUser.claims.first_name || 'Unknown',
        lastName: sessionUser.claims.last_name || '',
        profileImageUrl: sessionUser.claims.profile_image_url
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.data.user.firstName} connected to chat`);

    // Join the public room by default
    socket.join('public');

    // Handle joining specific rooms
    socket.on('chat:join', (roomId: string) => {
      socket.leave('public'); // Leave current room
      socket.join(roomId);
      console.log(`User ${socket.data.user.firstName} joined room: ${roomId}`);
    });

    // Handle real-time text messages
    socket.on('chat:message', async (data: { roomId: string; content: string }) => {
      try {
        const { roomId, content } = data;
        
        // Validate message content
        if (!content || content.trim().length === 0 || content.length > 1000) {
          socket.emit('chat:error', { message: 'Invalid message content' });
          return;
        }

        // Create message in database
        const chatMessage = await storage.createChatMessage({
          roomId: roomId || 'public',
          userId: socket.data.user.id,
          content: content.trim(),
          audioUrl: null,
          audioDurationSec: null,
          mimeType: null
        });

        // Broadcast to all users in the room
        const messageWithUser = {
          ...chatMessage,
          user: socket.data.user
        };

        io.to(roomId || 'public').emit('chat:message', messageWithUser);
        
      } catch (error) {
        console.error('Error handling chat message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
      socket.to(data.roomId || 'public').emit('chat:typing', {
        userId: socket.data.user.id,
        userName: `${socket.data.user.firstName} ${socket.data.user.lastName}`.trim(),
        isTyping: data.isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.firstName} disconnected from chat`);
    });
  });

  // Attach io to the app so routes can access it for broadcasting
  app.set('io', io);

  return httpServer;
}
