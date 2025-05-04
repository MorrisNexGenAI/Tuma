import { db } from "./index";
import { creators } from "@shared/schema";
import { auth } from "../server/auth";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");

    // Sample services data
    const sampleServices = [
      {
        serviceName: "Bright Room in Sinkor",
        serviceType: "Room",
        phone: "770123456",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "24th Street, Sinkor",
        operatingHours: "8:00 AM - 6:00 PM"
      },
      {
        serviceName: "Family Restaurant",
        serviceType: "Restaurant",
        phone: "880345678",
        password: "password123",
        county: "Montserrado",
        city: "Paynesville",
        community: "ELWA Junction",
        operatingHours: "9:00 AM - 10:00 PM"
      },
      {
        serviceName: "Stylish Cuts Barbershop",
        serviceType: "Barbershop",
        phone: "770987654",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "Broad Street",
        operatingHours: "7:00 AM - 8:00 PM"
      },
      {
        serviceName: "Furnished Room with AC",
        serviceType: "Room",
        phone: "886543210",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "12th Street, Sinkor",
        operatingHours: "24/7 Available"
      },
      {
        serviceName: "Student Room for Rent",
        serviceType: "Room",
        phone: "770987123",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "Sinkor, Near UL Campus",
        operatingHours: "9:00 AM - 9:00 PM"
      },
      {
        serviceName: "Beauty Plus Salon",
        serviceType: "Salon",
        phone: "880765432",
        password: "password123",
        county: "Montserrado",
        city: "Paynesville",
        community: "Red Light Market",
        operatingHours: "8:30 AM - 7:00 PM"
      },
      {
        serviceName: "Monrovia Grand Restaurant",
        serviceType: "Restaurant",
        phone: "776541230",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "UN Drive",
        operatingHours: "11:00 AM - 11:00 PM"
      },
      {
        serviceName: "Executive Barber Studio",
        serviceType: "Barbershop",
        phone: "886789012",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "Mamba Point",
        operatingHours: "8:00 AM - 8:00 PM"
      },
      {
        serviceName: "Luxury Apartment",
        serviceType: "Room",
        phone: "770345123",
        password: "password123",
        county: "Montserrado",
        city: "Monrovia",
        community: "Congo Town",
        operatingHours: "9:00 AM - 6:00 PM"
      },
      {
        serviceName: "Hair Palace Salon",
        serviceType: "Salon",
        phone: "889012345",
        password: "password123",
        county: "Margibi",
        city: "Kakata",
        community: "Main Street",
        operatingHours: "8:00 AM - 7:00 PM"
      }
    ];

    // Check if there are existing services
    const existingServices = await db.query.services.findMany();
    
    if (existingServices.length === 0) {
      console.log("No existing services found. Adding sample services...");
      
      // Add sample services
      for (const serviceData of sampleServices) {
        try {
          // Check if creator with this phone already exists
          const existingCreator = await db.query.creators.findFirst({
            where: eq(creators.phone, serviceData.phone)
          });
          
          if (!existingCreator) {
            await auth.register(serviceData);
            console.log(`Created service: ${serviceData.serviceName}`);
          } else {
            console.log(`Service with phone ${serviceData.phone} already exists. Skipping.`);
          }
        } catch (error) {
          console.error(`Error creating service ${serviceData.serviceName}:`, error);
        }
      }
      
      console.log("Sample services added successfully.");
    } else {
      console.log(`Found ${existingServices.length} existing services. Skipping seed.`);
    }
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();
