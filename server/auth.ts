import { storage } from "./storage";
import { CreatorRegistration } from "@shared/schema";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto"; // Keep for backward compatibility

class Auth {
  // Hash password using bcrypt - more secure
  private hashPassword(password: string): string {
    // For new passwords, use bcrypt
    if (password.length < 50) { // Plain passwords will be shorter than hashed ones
      const saltRounds = 10;
      return bcrypt.hashSync(password, saltRounds);
    }
    
    // Return as is if it's already a hash (for backward compatibility)
    return password;
  }

  // Verify password with bcrypt or fallback to legacy hashing
  private verifyPassword(password: string, hashedPassword: string): boolean {
    // Try bcrypt first (for new passwords)
    try {
      if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
        return bcrypt.compareSync(password, hashedPassword);
      }
    } catch (err) {
      console.log("Bcrypt verification failed, trying legacy method", err);
    }
    
    // Fallback to legacy method (sha256)
    const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
    return legacyHash === hashedPassword;
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
      country: data.country || "Liberia", // Use provided country or default to Liberia
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
