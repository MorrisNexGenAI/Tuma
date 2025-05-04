import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Creators table (service providers)
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  joinedDate: text("joined_date"),
  followers: integer("followers").default(0),
  rating: text("rating"), // Stored as JSON with average and count
  socialLinks: text("social_links"), // Stored as JSON
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => creators.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  serviceType: text("service_type").notNull(),
  country: text("country").notNull().default("Liberia"),
  county: text("county").notNull(),
  city: text("city").notNull(),
  community: text("community").notNull(),
  description: text("description"),
  detailedDescription: text("detailed_description"), // More detailed information
  features: text("features"), // JSON array of features
  pricing: text("pricing"), // Pricing information
  images: text("images"), // Stored as JSON array of image URLs
  operatingHours: text("operating_hours"),
  available: integer("available").notNull().default(1), // 1 for On, 0 for Off
  viewCount: integer("view_count").default(0),
  tags: text("tags"), // For enhanced searching
  lastUpdated: text("last_updated"),
});

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id),
  eventType: text("event_type").notNull(), // view, contact_click, etc.
  eventData: text("event_data"), // Additional JSON data
  userLocation: text("user_location"), // County/city info
  userAgent: text("user_agent"), // Browser info
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  sessionId: text("session_id"), // To track unique visits
});

// Service stats table for aggregated metrics
export const serviceStats = pgTable("service_stats", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  totalViews: integer("total_views").default(0),
  contactClicks: integer("contact_clicks").default(0),
  viewsByDay: text("views_by_day"), // JSON with day breakdown
  viewsByHour: text("views_by_hour"), // JSON with hour breakdown
  locationBreakdown: text("location_breakdown"), // JSON with location stats
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Admin table for platform administration
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  pin: text("pin").notNull(), // Encrypted PIN for authentication
  role: text("role").default("admin"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System announcements table for admin broadcasts
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("normal"), // normal, important, critical
  targetAudience: text("target_audience").default("all"), // all, creators, specific regions
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin activity logs for auditing
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  action: text("action").notNull(), // create, update, delete, warn, etc.
  targetType: text("target_type").notNull(), // creator, service, announcement, etc.
  targetId: integer("target_id"), // ID of the affected item
  details: text("details"), // JSON details of the action
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Define relationships
export const creatorsRelations = relations(creators, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  creator: one(creators, {
    fields: [services.creatorId],
    references: [creators.id],
  }),
  analyticsEvents: many(analyticsEvents),
  stats: many(serviceStats),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  service: one(services, {
    fields: [analyticsEvents.serviceId],
    references: [services.id],
  }),
}));

export const serviceStatsRelations = relations(serviceStats, ({ one }) => ({
  service: one(services, {
    fields: [serviceStats.serviceId],
    references: [services.id],
  }),
}));

// Admin relations
export const adminsRelations = relations(admins, ({ many }) => ({
  announcements: many(announcements),
  logs: many(adminLogs),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  admin: one(admins, {
    fields: [announcements.adminId],
    references: [admins.id],
  }),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [adminLogs.adminId],
    references: [admins.id],
  }),
}));

// Validation schemas for creators
export const creatorInsertSchema = createInsertSchema(creators);
export type CreatorInsert = z.infer<typeof creatorInsertSchema>;
export type Creator = typeof creators.$inferSelect;

// Validation schemas for services
export const serviceInsertSchema = createInsertSchema(services, {
  name: (schema) => schema.min(3, "Service name must be at least 3 characters"),
  phone: (schema) => schema.min(8, "Phone number must be at least 8 digits"),
  serviceType: (schema) => schema.min(1, "Service type is required"),
  county: (schema) => schema.min(1, "County is required"),
  city: (schema) => schema.min(1, "City is required"),
  community: (schema) => schema.min(1, "Community is required"),
});

export type ServiceInsert = z.infer<typeof serviceInsertSchema>;
export type Service = typeof services.$inferSelect;

// Creator registration schema (for API validation)
export const creatorRegistrationSchema = z.object({
  serviceName: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().default("Liberia"),
  county: z.string().min(1, "County is required"),
  city: z.string().min(1, "City is required"),
  community: z.string().min(1, "Community/area is required"),
  operatingHours: z.string().optional(),
});

export type CreatorRegistration = z.infer<typeof creatorRegistrationSchema>;

// Creator login schema
export const creatorLoginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreatorLogin = z.infer<typeof creatorLoginSchema>;

// Service update schema
export const serviceUpdateSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  country: z.string().default("Liberia"),
  county: z.string().min(1, "County is required"),
  city: z.string().min(1, "City is required"),
  community: z.string().min(1, "Community/area is required"),
  description: z.string().optional(),
  images: z.string().optional(), // JSON string of image URLs
  operatingHours: z.string().optional(),
  pricing: z.string().optional(), // Price information (e.g. "$20 USD" or "200-300 LD")
  available: z.boolean().default(true),
});

// Extended service update schema (including detailed descriptions)
export const extendedServiceUpdateSchema = z.object({
  name: z.string().min(3, "Service name must be at least 3 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  country: z.string().default("Liberia"),
  county: z.string().min(1, "County is required"),
  city: z.string().min(1, "City is required"),
  community: z.string().min(1, "Community/area is required"),
  description: z.string().optional(),
  detailedDescription: z.string().optional(),
  features: z.string().optional(), // JSON string of features
  pricing: z.string().optional(),
  images: z.string().optional(), // JSON string of image URLs
  operatingHours: z.string().optional(),
  available: z.boolean().default(true),
  tags: z.string().optional(),
});

// Profile update schema for creator
export const profileUpdateSchema = z.object({
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z.string().optional(),
});

export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;
export type ExtendedServiceUpdate = z.infer<typeof extendedServiceUpdateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Admin schemas
export const adminInsertSchema = createInsertSchema(admins);
export type AdminInsert = z.infer<typeof adminInsertSchema>;
export type Admin = typeof admins.$inferSelect;

// Admin login schema
export const adminLoginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  pin: z.string().min(4, "PIN is required").max(6, "PIN cannot exceed 6 digits"),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;

// Announcement schema
export const announcementSchema = createInsertSchema(announcements, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  message: (schema) => schema.min(10, "Message must be at least 10 characters"),
});

export type AnnouncementInsert = z.infer<typeof announcementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// System statistics type for admin dashboard
export type SystemStats = {
  totalCreators: number;
  activeCreators: number;
  totalServices: number;
  newCreatorsToday: number;
  dailyViews: number;
  totalViews: number;
  populatedCounties: { name: string; count: number }[];
  serviceTypeDistribution: { type: string; count: number }[];
  creatorGrowthData: { date: string; count: number }[];
};
