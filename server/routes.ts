import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./auth";
import * as schema from "@shared/schema";
import { ZodError } from "zod";
import "express-session";
import { UploadedFile } from "express-fileupload";
import { handleFileUpload, handleMultipleFileUploads, ensureUploadsDir } from "./uploads";
import { adminRouter } from "./admin-routes";

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    creatorId?: number;
    adminId?: number;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || (!req.session.creatorId && !req.session.adminId)) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  next();
};

// Admin authentication middleware
const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.adminId) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount the admin router
  app.use('/api/admin', adminRouter);
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = schema.creatorLoginSchema.parse(req.body);
      const user = await auth.login(data.phone, data.password);
      
      // Check if this is an admin or a creator
      if (user.isAdmin) {
        // Set admin ID in session
        req.session.adminId = user.id;
        req.session.creatorId = undefined; // Clear creator ID if present
        
        res.status(200).json({ 
          message: "Admin login successful",
          isAdmin: true,
          user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
          }
        });
      } else {
        // Set creator ID in session
        req.session.creatorId = user.id;
        req.session.adminId = undefined; // Clear admin ID if present
        
        res.status(200).json({ 
          message: "Login successful",
          isAdmin: false,
          user: {
            id: user.id,
            phone: user.phone
          }
        });
      }
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
    const isLoggedIn = !!(req.session.creatorId || req.session.adminId);
    const isAdmin = !!req.session.adminId;
    
    res.status(200).json({ 
      isLoggedIn,
      isAdmin,
      userId: isAdmin ? req.session.adminId : req.session.creatorId
    });
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
        description: data.description,
        images: data.images,
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
      
      // Normalize query by handling common misspellings and alternative forms
      let normalizedQuery = query.toLowerCase();
      
      // Special case for Tubmanburg/Tubman Burg/Tubman-burg/etc.
      if (normalizedQuery.includes("tubman") && (
          normalizedQuery.includes("burg") || 
          normalizedQuery.includes("berg") ||
          normalizedQuery.includes("bourg"))) {
        normalizedQuery = normalizedQuery.replace(/tubman[\s-]?b[ue]r[g|gh]/, "tubmanburg");
      }
      
      // Special case for location names with common variations
      const locationMappings: Record<string, string[]> = {
        "montserrado": ["monserrado", "monsterrado", "monrovia county", "greater monrovia"],
        "monrovia": ["monrovia city", "central monrovia"],
        "bomi": ["bomi county", "tubmanburg county"],
        "tubmanburg": ["tubman burg", "tubman-burg", "tubmanberg", "tubman berg"]
      };
      
      // Enhance query with location mappings
      for (const [location, variations] of Object.entries(locationMappings)) {
        if (variations.some(v => normalizedQuery.includes(v))) {
          normalizedQuery = normalizedQuery + " " + location;
        }
      }
      
      console.log(`Original query: "${query}", Normalized: "${normalizedQuery}"`);
      
      const results = await storage.searchServices(normalizedQuery);
      res.status(200).json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Upload profile image
  app.post("/api/creators/profile-image", requireAuth, ensureUploadsDir, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      
      if (!req.files || !req.files.profileImage) {
        return res.status(400).json({ message: "No profile image uploaded" });
      }
      
      const profileImage = req.files.profileImage as UploadedFile;
      
      // Check if it's an image
      if (!profileImage.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "Uploaded file is not an image" });
      }
      
      // Upload the image
      const imagePath = await handleFileUpload(profileImage);
      
      // Update creator profile with image path
      await storage.updateCreatorProfile(creatorId, { profileImage: imagePath });
      
      res.status(200).json({ message: "Profile image uploaded successfully", profileImage: imagePath });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  
  // Upload service images
  app.post("/api/services/:id/images", requireAuth, ensureUploadsDir, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const creatorId = req.session.creatorId as number;
      
      // Verify service belongs to creator
      const service = await storage.getServiceById(serviceId);
      if (!service || service.creatorId !== creatorId) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      if (!req.files || !req.files.images) {
        return res.status(400).json({ message: "No images uploaded" });
      }
      
      // Handle multiple image uploads (max 3)
      const uploadedImages = await handleMultipleFileUploads(req.files.images);
      
      // Get existing images if any
      const existingImagesStr = service.images || '[]';
      let existingImages: string[] = [];
      
      try {
        existingImages = JSON.parse(existingImagesStr);
      } catch (e) {
        existingImages = [];
      }
      
      // Combine existing and new images, limit to 3
      const allImages = [...existingImages, ...uploadedImages].slice(0, 3);
      
      // Update service with new images
      await storage.updateService(serviceId, {
        images: JSON.stringify(allImages)
      });
      
      res.status(200).json({ 
        message: "Service images uploaded successfully", 
        images: allImages,
        totalCount: allImages.length
      });
    } catch (error) {
      console.error("Service images upload error:", error);
      res.status(500).json({ message: "Failed to upload service images" });
    }
  });
  
  // Update service description
  app.put("/api/services/:id/description", requireAuth, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const creatorId = req.session.creatorId as number;
      
      // Verify service belongs to creator
      const service = await storage.getServiceById(serviceId);
      if (!service || service.creatorId !== creatorId) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      const { description } = req.body;
      
      if (typeof description !== 'string') {
        return res.status(400).json({ message: "Description must be a string" });
      }
      
      // Update service description
      await storage.updateService(serviceId, { description });
      
      res.status(200).json({ message: "Service description updated successfully" });
    } catch (error) {
      console.error("Update description error:", error);
      res.status(500).json({ message: "Failed to update service description" });
    }
  });
  
  // Get creator profile
  app.get("/api/creator/profile", requireAuth, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      const creator = await storage.getCreatorById(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      res.status(200).json(creator);
    } catch (error) {
      console.error("Get creator profile error:", error);
      res.status(500).json({ message: "Failed to get creator profile" });
    }
  });
  
  // Get creator profile by ID for public viewing
  app.get("/api/creators/:id", async (req, res) => {
    try {
      const creatorId = parseInt(req.params.id);
      
      if (isNaN(creatorId)) {
        return res.status(400).json({ message: "Invalid creator ID" });
      }
      
      // Get creator profile
      const creator = await storage.getCreatorById(creatorId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      // Get creator's service
      const service = await storage.getServiceByCreatorId(creatorId);
      
      // Increment view count if service exists
      if (service) {
        const currentViewCount = service.viewCount || 0;
        await storage.updateService(service.id, { 
          viewCount: currentViewCount + 1 
        });
        // Update the service object with the new view count
        service.viewCount = (currentViewCount + 1);
      }
      
      // Return both creator and service data
      res.status(200).json({ 
        creator, 
        service 
      });
    } catch (error) {
      console.error("Get creator by ID error:", error);
      res.status(500).json({ message: "Failed to get creator profile" });
    }
  });
  
  // Update creator profile
  app.put("/api/creator/profile", requireAuth, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      const data = schema.profileUpdateSchema.parse(req.body);
      
      // Update creator profile
      await storage.updateCreatorProfile(creatorId, data);
      
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update creator profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Generic file upload endpoint
  app.post("/api/upload", requireAuth, ensureUploadsDir, async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Handle multiple files
      const uploadedFiles = req.files.files;
      const paths = await handleMultipleFileUploads(uploadedFiles);
      
      res.status(200).json({ message: "Files uploaded successfully", files: paths });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });
  
  // Profile image upload endpoint
  app.post("/api/upload/profile", requireAuth, ensureUploadsDir, async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Handle single file
      const file = req.files.file as UploadedFile;
      const path = await handleFileUpload(file);
      
      res.status(200).json({ message: "File uploaded successfully", file: path });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  
  // Route to get services by location
  app.get("/api/services/location", async (req, res) => {
    try {
      const { county, city } = req.query;
      
      if (!county && !city) {
        return res.status(400).json({ message: "County or city parameter is required" });
      }
      
      const services = await storage.getServicesByLocation(county as string, city as string);
      res.status(200).json(services);
    } catch (error) {
      console.error("Get services by location error:", error);
      res.status(500).json({ message: "Failed to get services by location" });
    }
  });
  
  // Advanced search with filters and pagination
  app.get("/api/search/advanced", async (req, res) => {
    try {
      const { 
        q = "", 
        county, 
        city, 
        serviceType, 
        available, 
        sort, 
        page,
        limit
      } = req.query;
      
      const query = typeof q === 'string' ? q : '';
      
      // Convert query parameters to appropriate types
      const filters: Record<string, any> = {};
      
      if (county && typeof county === 'string') filters.county = county;
      if (city && typeof city === 'string') filters.city = city;
      if (serviceType && typeof serviceType === 'string') filters.serviceType = serviceType;
      if (available !== undefined) filters.available = available === 'true';
      if (sort && typeof sort === 'string') filters.sort = sort;
      if (page) filters.page = parseInt(page as string) || 1;
      if (limit) filters.limit = parseInt(limit as string) || 12;
      
      const results = await storage.advancedSearch(query, filters);
      res.status(200).json(results);
    } catch (error) {
      console.error("Advanced search error:", error);
      res.status(500).json({ message: "Failed to perform advanced search" });
    }
  });
  

  
  // Update service details (for detailed descriptions)
  app.patch("/api/services/:id/details", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const serviceId = parseInt(id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      // Get the service to check ownership
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (service.creatorId !== req.session.creatorId) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      // Handle image uploads if present
      let updatedData: Partial<schema.ExtendedServiceUpdate> = { ...req.body };
      
      if (req.files && Object.keys(req.files).length > 0) {
        if (req.files.images) {
          const images = req.files.images;
          const imageFiles = Array.isArray(images) ? images : [images];
          
          // Limit to 3 images
          const limitedImageFiles = imageFiles.slice(0, 3);
          
          const uploadedImages = await handleMultipleFileUploads(limitedImageFiles);
          updatedData.images = JSON.stringify(uploadedImages);
        }
      }
      
      // Update the service details
      const updatedService = await storage.updateServiceDetails(serviceId, updatedData);
      
      res.status(200).json(updatedService);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update service details error:", error);
      res.status(500).json({ message: "Failed to update service details" });
    }
  });
  
  // Toggle service availability
  app.post("/api/services/:id/toggle-availability", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const serviceId = parseInt(id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: "Invalid service ID" });
      }
      
      // Get the service to check ownership
      const service = await storage.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (service.creatorId !== req.session.creatorId) {
        return res.status(403).json({ message: "You don't have permission to update this service" });
      }
      
      // Toggle availability
      const updatedService = await storage.toggleServiceAvailability(serviceId);
      
      res.status(200).json(updatedService);
    } catch (error) {
      console.error("Toggle availability error:", error);
      res.status(500).json({ message: "Failed to toggle service availability" });
    }
  });
  
  // Analytics endpoints
  
  // Track analytics event 
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { serviceId, eventType, data = {}, userInfo = {} } = req.body;
      
      if (!serviceId || !eventType) {
        return res.status(400).json({ message: "serviceId and eventType are required" });
      }
      
      const event = await storage.trackEvent(
        parseInt(serviceId), 
        eventType, 
        data,
        userInfo
      );
      
      res.status(200).json({ success: true, event });
    } catch (error) {
      console.error("Track event error:", error);
      // Still return 200 status for analytics - don't block user experience
      res.status(200).json({ success: false, message: "Failed to track event" });
    }
  });
  
  // Get analytics data for creator's service
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      const { timeframe = "week" } = req.query;
      
      // Get the creator's service
      const service = await storage.getServiceByCreatorId(creatorId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get analytics data
      const analytics = await storage.getServiceAnalytics(
        service.id, 
        timeframe as "week" | "month" | "all"
      );
      
      res.status(200).json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to retrieve analytics data" });
    }
  });
  
  // Get services for logged in creator
  app.get("/api/services/me", requireAuth, async (req, res) => {
    try {
      const creatorId = req.session.creatorId as number;
      const service = await storage.getServiceByCreatorId(creatorId);
      
      if (!service) {
        return res.status(404).json({ message: "No service found" });
      }
      
      res.status(200).json(service);
    } catch (error) {
      console.error("Get creator service error:", error);
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
