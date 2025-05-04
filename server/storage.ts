import { db } from "@db";
import { creators, services, Service, ProfileUpdate } from "@shared/schema";
import { eq, and, like, or, desc, asc, sql } from "drizzle-orm";

interface GetServicesOptions {
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  availableOnly?: boolean;
}

class Storage {
  // Creator methods
  async createCreator(phone: string, passwordHash: string) {
    const [creator] = await db.insert(creators).values({
      phone,
      password: passwordHash,
    }).returning();
    
    return creator;
  }

  async getCreatorById(id: number) {
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, id),
    });
    
    return creator;
  }

  async getCreatorByPhone(phone: string) {
    const creator = await db.query.creators.findFirst({
      where: eq(creators.phone, phone),
    });
    
    return creator;
  }

  async deleteCreator(id: number) {
    await db.delete(creators).where(eq(creators.id, id));
  }

  // Service methods
  async createService(data: Omit<typeof services.$inferInsert, "id">) {
    const [service] = await db.insert(services).values(data).returning();
    return service;
  }

  async getServiceById(id: number) {
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });
    
    return service;
  }

  async getServiceByCreatorId(creatorId: number) {
    const service = await db.query.services.findFirst({
      where: eq(services.creatorId, creatorId),
    });
    
    return service;
  }

  async getServices(options: GetServicesOptions = {}) {
    const { category, sort = "newest", page = 1, limit = 12, availableOnly = false } = options;
    
    // Base query
    let query = db.select().from(services);
    
    // Apply filters
    if (category) {
      query = query.where(eq(services.serviceType, category));
    }
    
    if (availableOnly) {
      query = query.where(eq(services.available, 1));
    }
    
    // Apply sorting
    if (sort === "newest") {
      query = query.orderBy(desc(services.id));
    } else if (sort === "closest") {
      // For demo purposes, just sort by city/community
      // In a real app, this would use geolocation
      query = query.orderBy(asc(services.city), asc(services.community));
    }
    
    // Apply pagination
    query = query.limit(limit).offset((page - 1) * limit);
    
    return query;
  }

  async updateService(id: number, data: Partial<typeof services.$inferInsert>) {
    await db.update(services)
      .set(data)
      .where(eq(services.id, id));
  }

  async deleteService(id: number) {
    await db.delete(services).where(eq(services.id, id));
  }

  // Search services
  async searchServices(query: string) {
    const terms = query.toLowerCase().split(/\s+/);
    
    // Build the query with SQL directly to avoid type issues
    const whereConditions = terms.map(term => {
      const searchPattern = `%${term}%`;
      return sql`(
        ${services.serviceType} ILIKE ${searchPattern} OR
        ${services.community} ILIKE ${searchPattern} OR
        ${services.city} ILIKE ${searchPattern} OR
        ${services.county} ILIKE ${searchPattern} OR
        ${services.name} ILIKE ${searchPattern}
      )`;
    });
    
    // Combine all conditions with AND
    const whereClause = sql`${services.available} = 1`;
    const results = await db.select().from(services).where(whereClause);
    
    // Filter results based on search terms
    const filteredResults = results.filter(service => {
      return terms.every(term => {
        const searchTerm = term.toLowerCase();
        return (
          service.serviceType.toLowerCase().includes(searchTerm) ||
          service.community.toLowerCase().includes(searchTerm) ||
          service.city.toLowerCase().includes(searchTerm) ||
          service.county.toLowerCase().includes(searchTerm) ||
          service.name.toLowerCase().includes(searchTerm)
        );
      });
    });
    
    // Rank results by match quality (community > city > county)
    return filteredResults.sort((a, b) => {
      // Higher score means better match
      const getScore = (service: Service) => {
        let score = 0;
        
        for (const term of terms) {
          if (service.community.toLowerCase().includes(term)) score += 3;
          if (service.city.toLowerCase().includes(term)) score += 2;
          if (service.county.toLowerCase().includes(term)) score += 1;
          if (service.serviceType.toLowerCase().includes(term)) score += 4;
        }
        
        return score;
      };
      
      return getScore(b) - getScore(a);
    });
  }
  
  // Update creator profile
  async updateCreatorProfile(id: number, data: ProfileUpdate) {
    await db.update(creators)
      .set(data)
      .where(eq(creators.id, id));
  }
  
  // Get services by location
  async getServicesByLocation(county?: string, city?: string) {
    // Base query
    let query = db.select().from(services);
    
    // Apply location filters
    if (county) {
      query = query.where(eq(services.county, county));
    }
    
    if (city) {
      query = query.where(eq(services.city, city));
    }
    
    // Only show available services
    query = query.where(eq(services.available, 1));
    
    // Order by newest first
    query = query.orderBy(desc(services.id));
    
    return query;
  }
}

export const storage = new Storage();
