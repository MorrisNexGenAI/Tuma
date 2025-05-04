import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Creators table (service providers)
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
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
  operatingHours: text("operating_hours"),
  available: integer("available").notNull().default(1), // 1 for On, 0 for Off
});

// Define relationships
export const creatorsRelations = relations(creators, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  creator: one(creators, {
    fields: [services.creatorId],
    references: [creators.id],
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
  county: z.string().min(1, "Please select a county"),
  city: z.string().min(1, "Please select a city"),
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
  county: z.string().min(1, "Please select a county"),
  city: z.string().min(1, "Please select a city"),
  community: z.string().min(1, "Community/area is required"),
  operatingHours: z.string().optional(),
  available: z.boolean().default(true),
});

export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;
