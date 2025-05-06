import { storage } from "./storage";
import { CreatorRegistration } from "@shared/schema";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto"; // Keep for backward compatibility
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

class Auth {
  // Hash password using bcrypt - more secure
  private hashPassword(password: string): string {
    // For new passwords, use bcrypt
    if (password.length < 50) { // Plain passwords will be shorter than hashed ones
      // Get salt rounds from environment or use default
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
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
    
    // Fallback to legacy method (sha256) with salt if available
    const salt = process.env.LEGACY_PASSWORD_SALT || "";
    const legacyHash = crypto.createHash("sha256").update(password + salt).digest("hex");
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

  // Login creator or admin
  async login(phone: string, password: string) {
    // First check if it's an admin
    try {
      const admin = await storage.getAdminByPhone(phone);
      
      if (admin) {
        // Verify admin PIN using SHA-256 with salt from environment variables
        const salt = process.env.ADMIN_PIN_SALT || "tumaAdminSalt";
        const hashedPin = crypto.createHash("sha256").update(password + salt).digest("hex");
        
        if (admin.pin === hashedPin) {
          // Update admin's last login time
          await storage.updateAdminLastLogin(admin.id);
          
          // Return admin with a special flag to identify them
          return {
            ...admin,
            isAdmin: true
          };
        }
      }
    } catch (err) {
      console.error("Error checking for admin login:", err);
      // Continue to creator login flow if admin check fails
    }
    
    // If not an admin, try creator login
    const creator = await storage.getCreatorByPhone(phone);
    
    if (!creator) {
      throw new Error("Account not found");
    }
    
    if (!this.verifyPassword(password, creator.password)) {
      throw new Error("Invalid password");
    }
    
    return {
      ...creator,
      isAdmin: false
    };
  }
}

export const auth = new Auth();
