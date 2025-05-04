import { storage } from "./storage";
import { CreatorRegistration } from "@shared/schema";
import * as crypto from "crypto";

class Auth {
  // Hash password (simple hash for MVP)
  private hashPassword(password: string): string {
    return crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
  }

  // Verify password
  private verifyPassword(password: string, hashedPassword: string): boolean {
    const passwordHash = this.hashPassword(password);
    return passwordHash === hashedPassword;
  }

  // Register creator and service
  async register(data: CreatorRegistration) {
    const passwordHash = this.hashPassword(data.password);
    
    // Create creator
    const creator = await storage.createCreator(data.phone, passwordHash);
    
    // Create service
    await storage.createService({
      creatorId: creator.id,
      name: data.serviceName,
      phone: data.phone,
      serviceType: data.serviceType,
      country: "Liberia", // Hardcoded for Liberia
      county: data.county,
      city: data.city,
      community: data.community,
      operatingHours: data.operatingHours || null,
      available: 1, // Default to available
    });
    
    return creator;
  }

  // Login creator
  async login(phone: string, password: string) {
    const creator = await storage.getCreatorByPhone(phone);
    
    if (!creator) {
      throw new Error("Creator not found");
    }
    
    if (!this.verifyPassword(password, creator.password)) {
      throw new Error("Invalid password");
    }
    
    return creator;
  }
}

export const auth = new Auth();
