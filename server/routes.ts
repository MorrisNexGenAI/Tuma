import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./auth";
import * as schema from "@shared/schema";
import { ZodError } from "zod";
import "express-session";

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    creatorId?: number;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.creatorId) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = schema.creatorLoginSchema.parse(req.body);
      const creator = await auth.login(data.phone, data.password);
      
      // Set creator ID in session
      req.session.creatorId = creator.id;
      
      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(401).json({ message: "Invalid phone number or password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    const isLoggedIn = !!req.session.creatorId;
    res.status(200).json({ isLoggedIn });
  });

  // Creators routes
  app.post("/api/creators", async (req, res) => {
    try {
      const data = schema.creatorRegistrationSchema.parse(req.body);
      
      // Check if phone number is already registered
      const existingCreator = await storage.getCreatorByPhone(data.phone);
      if (existingCreator) {
        return res.status(409).json({ message: "Phone number already registered" });
      }
      
      // Register creator and service
      const newCreator = await auth.register(data);
      
      res.status(201).json({ 
        message: "Registration successful", 
        creatorId: newCreator.id 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const { category, sort = "newest", page = "1", limit = "12" } = req.query;
      
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 12;
      
      const services = await storage.getServices({
        category: category as string,
        sort: sort as string,
        page: pageNumber,
        limit: limitNumber,
        availableOnly: true,
      });
      
      res.status(200).json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.get("/api/services/me", requireAuth, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      const service = await storage.getServiceByCreatorId(creatorId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(200).json(service);
    } catch (error) {
      console.error("Get creator service error:", error);
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const creatorId = req.session.creatorId as number;
      
      // Verify service belongs to creator
      const service = await storage.getServiceById(serviceId);
      if (!service || service.creatorId !== creatorId) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      const data = schema.serviceUpdateSchema.parse(req.body);
      
      // Update service
      await storage.updateService(serviceId, {
        name: data.name,
        serviceType: data.serviceType,
        phone: data.phone,
        country: data.country || "Liberia",
        county: data.county,
        city: data.city,
        community: data.community,
        operatingHours: data.operatingHours,
        available: data.available ? 1 : 0,
      });
      
      res.status(200).json({ message: "Service updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const creatorId = req.session.creatorId as number;
      
      // Verify service belongs to creator
      const service = await storage.getServiceById(serviceId);
      if (!service || service.creatorId !== creatorId) {
        return res.status(403).json({ message: "You don't have permission to delete this service" });
      }
      
      // Delete service
      await storage.deleteService(serviceId);
      
      // Delete creator as well
      await storage.deleteCreator(creatorId);
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
      
      res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Search route
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const results = await storage.searchServices(query);
      res.status(200).json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
