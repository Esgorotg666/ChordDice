import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChordProgressionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
