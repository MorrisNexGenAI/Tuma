import { db } from "./index";
import { admins } from "@shared/schema";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";

// Function to hash a PIN
function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

async function createAdmin() {
  try {
    console.log("Checking for existing admin account...");
    
    // Check for existing admin (Morris D. Dawakai)
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(admins.phone, "0770410579"),
    });
    
    // Create admin if he doesn't exist
    if (!existingAdmin) {
      console.log("Creating admin account for Morris D. Dawakai...");
      
      await db.insert(admins).values({
        fullName: "Morris D. Dawakai",
        phone: "0770410579",
        pin: hashPin("200817"), // Hash the PIN for security
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