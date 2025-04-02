import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import socialRoutes from "./api/social";
import authRoutes from "./api/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth routes
  app.use("/api/auth", authRoutes);

  // Register social media routes
  app.use("/api/social", socialRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
