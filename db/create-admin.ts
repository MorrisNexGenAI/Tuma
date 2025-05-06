import { db } from "./index";
import { admins } from "@shared/schema";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Function to hash a PIN
function hashPin(pin: string): string {
  // Use salt from environment variables or default
  const salt = process.env.ADMIN_PIN_SALT || "tumaAdminSalt";
  return createHash('sha256').update(pin + salt).digest('hex');
}

async function createAdmin() {
  try {
    console.log("Checking for existing admin account...");
    
    // Get admin details from environment variables
    const adminPhone = process.env.ADMIN_PHONE || "0770410579";
    const adminPin = process.env.ADMIN_PIN || "200817";
    const adminName = process.env.ADMIN_NAME || "Morris D. Dawakai";
    
    // Check for existing admin
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(admins.phone, adminPhone),
    });
    
    // Create admin if he doesn't exist
    if (!existingAdmin) {
      console.log(`Creating admin account for ${adminName}...`);
      
      await db.insert(admins).values({
        fullName: adminName,
        phone: adminPhone,
        pin: hashPin(adminPin), // Hash the PIN for security
        role: "admin",
        isActive: true,
        createdAt: new Date(),
      });
      
      console.log("Admin account created successfully!");
    } else {
      console.log("Admin account already exists, skipping creation.");
    }
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

createAdmin().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Error executing script:", err);
  process.exit(1);
});