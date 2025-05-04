import { Request, Response, NextFunction, Router } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { adminLoginSchema, admins } from "@shared/schema";
import { createHash } from "crypto";

// Create an Express router
export const adminRouter = Router();

// Hash PIN for security
function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

// Middleware for admin authentication
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Check authentication status
adminRouter.get("/status", (req, res) => {
  res.json({ isLoggedIn: !!req.session.adminId });
});

// Admin login
adminRouter.post("/login", async (req, res) => {
  try {
    // Validate request body
    const data = adminLoginSchema.parse(req.body);
    const admin = await storage.getAdminByPhone(data.phone);
    
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Verify PIN
    const hashedPin = hashPin(data.pin);
    if (admin.pin !== hashedPin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Set session
    req.session.adminId = admin.id;
    
    // Update last login
    await storage.updateAdminLastLogin(admin.id);
    
    // Log action
    await storage.logAdminAction(
      admin.id, 
      "LOGIN", 
      "system", 
      undefined, 
      "Admin logged in"
    );
    
    // Return admin info (exclude sensitive data)
    const { pin, ...adminData } = admin;
    res.status(200).json(adminData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Admin login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// Admin logout
adminRouter.post("/logout", requireAdminAuth, async (req, res) => {
  try {
    const adminId = req.session.adminId;
    
    // Log action before destroying session
    if (adminId) {
      await storage.logAdminAction(
        adminId, 
        "LOGOUT", 
        "system", 
        undefined, 
        "Admin logged out"
      );
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({ error: "An error occurred during logout" });
  }
});

// Get system statistics
adminRouter.get("/stats", requireAdminAuth, async (req, res) => {
  try {
    const stats = await storage.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ error: "Failed to fetch system statistics" });
  }
});

// Get admin logs
adminRouter.get("/logs", requireAdminAuth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await storage.getAdminLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    res.status(500).json({ error: "Failed to fetch admin logs" });
  }
});

// Get login activity
adminRouter.get("/activity", requireAdminAuth, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const activity = await storage.getLoginActivity(days);
    res.json(activity);
  } catch (error) {
    console.error("Error fetching login activity:", error);
    res.status(500).json({ error: "Failed to fetch login activity" });
  }
});