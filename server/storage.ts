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
    // Common location name mappings for better matching
    const locationMappings: Record<string, string[]> = {
      "tubmanburg": ["tubman burg", "tubman-burg", "tubmanberg", "tubman berg", "bomi"],
      "monrovia": ["monrovia city", "central monrovia", "greater monrovia", "monsterrado", "montserrado"],
      "bomi": ["bomi county", "tubmanburg", "tubman burg"],
      "montserrado": ["monsterrado", "monrovia county"],
      "kakata": ["kakata city", "margibi"],
      "margibi": ["margibi county", "kakata"],
      "buchanan": ["buchanan city", "grand bassa", "grandbassa"]
    };
    
    // Service type synonym mappings
    const serviceTypeMappings: Record<string, string[]> = {
      "room": ["apartment", "house", "flat", "rent", "bedroom"],
      "restaurant": ["food", "diner", "eatery", "cafe", "cafeteria"],
      "barbershop": ["barber", "haircut", "salon for men"],
      "salon": ["hair salon", "beauty salon", "beauty parlor", "hairdresser"]
    };
    
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    // Enhance search terms with mappings
    const enhancedTerms = new Set<string>(terms);
    
    // Add location mappings
    for (const term of terms) {
      // Add mapping terms when we find a match
      for (const [canonical, variations] of Object.entries(locationMappings)) {
        if (term === canonical || variations.some(v => term.includes(v))) {
          enhancedTerms.add(canonical);
          // Also add the reverse mapping for better recall
          if (term === canonical) {
            variations.forEach(v => enhancedTerms.add(v.replace(/\s+/g, "")));
          }
        }
      }
      
      // Add service type mappings
      for (const [canonical, variations] of Object.entries(serviceTypeMappings)) {
        if (term === canonical || variations.some(v => term.includes(v))) {
          enhancedTerms.add(canonical);
        }
      }
    }
    
    // Convert back to array
    const searchTerms = Array.from(enhancedTerms);
    console.log(`Original terms: ${terms.join(', ')}, Enhanced: ${searchTerms.join(', ')}`);
    
    // Get all available services
    const whereClause = sql`${services.available} = 1`;
    const results = await db.select().from(services).where(whereClause);
    
    // Create fuzzy match function for location names
    const fuzzyMatch = (serviceValue: string, searchTerm: string): boolean => {
      if (!serviceValue) return false;
      
      const serviceValueLower = serviceValue.toLowerCase();
      
      // Direct match
      if (serviceValueLower.includes(searchTerm)) return true;
      
      // Remove spaces for matching variations like "tubmanburg" vs "tubman burg"
      if (serviceValueLower.replace(/\s+/g, "").includes(searchTerm.replace(/\s+/g, ""))) return true;
      
      // Check for partial matches at word boundaries
      const words = serviceValueLower.split(/\s+/);
      for (const word of words) {
        if (word.startsWith(searchTerm) || searchTerm.startsWith(word)) return true;
      }
      
      return false;
    };
    
    // Filter results with fuzzy matching
    const filteredResults = results.filter(service => {
      // If no search terms, return all services
      if (searchTerms.length === 0) return true;
      
      // Check if ANY search term matches (not requiring ALL terms to match)
      return searchTerms.some(term => {
        const searchTerm = term.toLowerCase();
        return (
          fuzzyMatch(service.serviceType, searchTerm) ||
          fuzzyMatch(service.community, searchTerm) ||
          fuzzyMatch(service.city, searchTerm) ||
          fuzzyMatch(service.county, searchTerm) ||
          fuzzyMatch(service.name, searchTerm) ||
          (service.description && fuzzyMatch(service.description, searchTerm))
        );
      });
    });
    
    // Rank results by match quality
    return filteredResults.sort((a, b) => {
      // Higher score means better match
      const getScore = (service: Service) => {
        let score = 0;
        
        for (const term of searchTerms) {
          // Exact matches get higher scores
          if (service.serviceType.toLowerCase() === term) score += 10;
          else if (fuzzyMatch(service.serviceType, term)) score += 5;
          
          if (service.community.toLowerCase() === term) score += 8;
          else if (fuzzyMatch(service.community, term)) score += 4;
          
          if (service.city.toLowerCase() === term) score += 6;
          else if (fuzzyMatch(service.city, term)) score += 3;
          
          if (service.county.toLowerCase() === term) score += 4;
          else if (fuzzyMatch(service.county, term)) score += 2;
          
          // Name and description matches
          if (fuzzyMatch(service.name, term)) score += 3;
          if (service.description && fuzzyMatch(service.description, term)) score += 1;
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
    
    // Apply location filters with ILIKE for case-insensitive matching
    if (county) {
      const countyPattern = `%${county}%`;
      query = query.where(sql`${services.county} ILIKE ${countyPattern}`);
    }
    
    if (city) {
      const cityPattern = `%${city}%`;
      query = query.where(sql`${services.city} ILIKE ${cityPattern}`);
    }
    
    // Only show available services
    query = query.where(eq(services.available, 1));
    
    // Order by newest first
    query = query.orderBy(desc(services.id));
    
    const results = await query;
    
    // Apply additional fuzzy matching if needed for locations with variations in spelling
    if (county || city) {
      // Define location mappings for fuzzy matching
      const locationMappings: Record<string, string[]> = {
        "tubmanburg": ["tubman burg", "tubman-burg", "tubmanberg", "tubman berg"],
        "monrovia": ["monrovia city", "central monrovia"],
        "bomi": ["bomi county", "tubmanburg county"],
        "montserrado": ["monsterrado", "monrovia county"]
      };
      
      return results.filter(service => {
        // If no county or city specified, include all services
        if (!county && !city) return true;
        
        // For county matching
        if (county) {
          const countyLower = county.toLowerCase();
          const serviceCouty = service.county.toLowerCase();
          
          // Direct match
          if (serviceCouty.includes(countyLower)) return true;
          
          // Check for variations
          for (const [canonical, variations] of Object.entries(locationMappings)) {
            if ((canonical === countyLower || variations.some(v => countyLower.includes(v))) && 
                (serviceCouty.includes(canonical) || variations.some(v => serviceCouty.includes(v)))) {
              return true;
            }
          }
        }
        
        // For city matching
        if (city) {
          const cityLower = city.toLowerCase();
          const serviceCity = service.city.toLowerCase();
          
          // Direct match
          if (serviceCity.includes(cityLower)) return true;
          
          // Check for variations
          for (const [canonical, variations] of Object.entries(locationMappings)) {
            if ((canonical === cityLower || variations.some(v => cityLower.includes(v))) && 
                (serviceCity.includes(canonical) || variations.some(v => serviceCity.includes(v)))) {
              return true;
            }
          }
        }
        
        return false;
      });
    }
    
    return results;
  }
}

export const storage = new Storage();
