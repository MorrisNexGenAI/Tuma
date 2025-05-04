import { Request, Response, NextFunction, Router } from "express";
import { createHash } from "crypto";
import { storage } from "./storage";
import { adminLoginSchema } from "@shared/schema";
import { z } from "zod";

const adminRouter = Router();

// Function to hash a PIN
function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

// Middleware to check admin authentication
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Admin login route
adminRouter.post("/login", async (req, res) => {
  try {
    // Validate request body
    const validatedData = adminLoginSchema.parse(req.body);
    const { phone, pin } = validatedData;
    
    // Find admin by phone
    const admin = await storage.getAdminByPhone(phone);
    
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Verify PIN
    const hashedPin = hashPin(pin);
    if (admin.pin !== hashedPin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Update last login
    await storage.updateAdminLastLogin(admin.id);
    
    // Set session
    req.session.adminId = admin.id;
    
    // Log the action
    await storage.logAdminAction(admin.id, "login", "admin", admin.id);
    
    // Return admin data (excluding pin)
    const { pin: _, ...adminData } = admin;
    res.json(adminData);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin logout route
adminRouter.post("/logout", requireAdminAuth, async (req, res) => {
  try {
    const adminId = req.session.adminId;
    
    // Log the action
    if (adminId) {
      await storage.logAdminAction(adminId, "logout", "admin", adminId);
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Error logging out" });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get admin status
adminRouter.get("/status", (req, res) => {
  res.json({
    isLoggedIn: Boolean(req.session.adminId),
  });
});

// Get system stats
adminRouter.get("/stats", requireAdminAuth, async (req, res) => {
  try {
    const stats = await storage.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get admin logs
adminRouter.get("/logs", requireAdminAuth, async (req, res) => {
  try {
    const logs = await storage.getAdminLogs();
    res.json(logs);
  } catch (error) {
    console.error("Error getting admin logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get login activity
adminRouter.get("/activity", requireAdminAuth, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const activity = await storage.getLoginActivity(days);
    res.json(activity);
  } catch (error) {
    console.error("Error getting login activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create announcement
adminRouter.post("/announcements", requireAdminAuth, async (req, res) => {
  try {
    const { title, message, priority, targetAudience, endDate } = req.body;
    
    const announcement = await storage.createAnnouncement(
      req.session.adminId!,
      {
        title,
        message,
        priority: priority || "normal",
        targetAudience: targetAudience || "all",
        endDate: endDate ? new Date(endDate) : undefined,
        isActive: true,
        startDate: new Date(),
      }
    );
    
    // Log the action
    await storage.logAdminAction(
      req.session.adminId!,
      "create_announcement",
      "announcement",
      announcement.id
    );
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get active announcements
adminRouter.get("/announcements", async (req, res) => {
  try {
    const announcements = await storage.getActiveAnnouncements();
    res.json(announcements);
  } catch (error) {
    console.error("Error getting announcements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update announcement
adminRouter.put("/announcements/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, message, priority, targetAudience, endDate, isActive } = req.body;
    
    await storage.updateAnnouncement(id, {
      title,
      message,
      priority,
      targetAudience,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive
    });
    
    // Log the action
    await storage.logAdminAction(
      req.session.adminId!,
      "update_announcement",
      "announcement",
      id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete announcement
adminRouter.delete("/announcements/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await storage.deleteAnnouncement(id);
    
    // Log the action
    await storage.logAdminAction(
      req.session.adminId!,
      "delete_announcement",
      "announcement",
      id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Warn creator
adminRouter.post("/warn-creator/:id", requireAdminAuth, async (req, res) => {
  try {
    const creatorId = parseInt(req.params.id);
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Warning message is required" });
    }
    
    await storage.warnCreator(creatorId, message, req.session.adminId!);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error warning creator:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete creator
adminRouter.delete("/creators/:id", requireAdminAuth, async (req, res) => {
  try {
    const creatorId = parseInt(req.params.id);
    
    // Log before deletion
    await storage.logAdminAction(
      req.session.adminId!,
      "delete_creator",
      "creator",
      creatorId
    );
    
    await storage.deleteCreator(creatorId);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting creator:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { adminRouter };