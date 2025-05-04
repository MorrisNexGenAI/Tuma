import { db } from "@db";
import { creators, services, Service, ProfileUpdate, ExtendedServiceUpdate, analyticsEvents, serviceStats } from "@shared/schema";
import { eq, and, like, or, desc, asc, sql, ilike, gte, lte } from "drizzle-orm";
import { format, subDays, subMonths } from "date-fns";

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
  
  // Enhanced search functionality with advanced algorithms
  async advancedSearch(query: string, filters: Record<string, any> = {}) {
    const { 
      county, 
      city, 
      serviceType, 
      available = true,
      sort = "relevance", 
      page = 1, 
      limit = 12 
    } = filters;
    
    // Normalize search terms
    console.log(`Original query: "${query}", Normalized: "${query.toLowerCase().trim()}"`);
    
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
      "room": ["apartment", "house", "flat", "rent", "bedroom", "housing"],
      "restaurant": ["food", "diner", "eatery", "cafe", "cafeteria", "dining"],
      "barbershop": ["barber", "haircut", "salon for men", "men's salon", "hair"],
      "salon": ["hair salon", "beauty salon", "beauty parlor", "hairdresser", "spa", "beauty"]
    };
    
    const terms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
    
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
    
    // Base query
    let baseQuery = db.select().from(services);
    
    // Apply explicit filters first
    if (county) {
      const countyPattern = `%${county}%`;
      baseQuery = baseQuery.where(sql`${services.county} ILIKE ${countyPattern}`);
    }
    
    if (city) {
      const cityPattern = `%${city}%`;
      baseQuery = baseQuery.where(sql`${services.city} ILIKE ${cityPattern}`);
    }
    
    if (serviceType) {
      baseQuery = baseQuery.where(eq(services.serviceType, serviceType));
    }
    
    if (available) {
      baseQuery = baseQuery.where(eq(services.available, 1));
    }
    
    // Get base results
    const baseResults = await baseQuery;
    
    // Create fuzzy match function for semantic matching
    const fuzzyMatch = (serviceValue: string | null, searchTerm: string): boolean => {
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
    const filteredResults = baseResults.filter(service => {
      // If no search terms, return the base results filtered by explicit filters
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
          fuzzyMatch(service.description, searchTerm) ||
          fuzzyMatch(service.detailedDescription, searchTerm) ||
          fuzzyMatch(service.tags, searchTerm) ||
          fuzzyMatch(service.features, searchTerm)
        );
      });
    });
    
    // Rank results by relevance and apply pagination
    let sortedResults = filteredResults;
    
    if (sort === "relevance" && searchTerms.length > 0) {
      // Rank by relevance
      sortedResults = filteredResults.sort((a, b) => {
        // Higher score means better match
        const getScore = (service: Service) => {
          let score = 0;
          
          for (const term of searchTerms) {
            // Exact matches get higher scores
            if (service.serviceType.toLowerCase() === term) score += 15;
            else if (fuzzyMatch(service.serviceType, term)) score += 10;
            
            if (service.community.toLowerCase() === term) score += 12;
            else if (fuzzyMatch(service.community, term)) score += 8;
            
            if (service.city.toLowerCase() === term) score += 10;
            else if (fuzzyMatch(service.city, term)) score += 6;
            
            if (service.county.toLowerCase() === term) score += 8;
            else if (fuzzyMatch(service.county, term)) score += 4;
            
            // Name matches
            if (service.name.toLowerCase() === term) score += 15;
            else if (fuzzyMatch(service.name, term)) score += 8;
            
            // Description matches
            if (service.description && fuzzyMatch(service.description, term)) score += 5;
            
            // Detailed matches
            if (service.detailedDescription && fuzzyMatch(service.detailedDescription, term)) score += 6;
            
            // Tags matches (higher weight because tags are explicit metadata)
            if (service.tags && fuzzyMatch(service.tags, term)) score += 12;
            
            // Features
            if (service.features && fuzzyMatch(service.features, term)) score += 7;
          }
          
          // Boost available services
          if (service.available === 1) score += 5;
          
          // Boost by view count (popularity)
          if (service.viewCount) {
            score += Math.min(service.viewCount / 10, 5); // Cap at 5 points
          }
          
          return score;
        };
        
        return getScore(b) - getScore(a);
      });
    } else if (sort === "newest") {
      // Sort by newest (highest ID first or using lastUpdated if available)
      sortedResults = filteredResults.sort((a, b) => {
        if (a.lastUpdated && b.lastUpdated) {
          return b.lastUpdated.localeCompare(a.lastUpdated);
        }
        return b.id - a.id;
      });
    } else if (sort === "popular") {
      // Sort by view count or other popularity metric
      sortedResults = filteredResults.sort((a, b) => {
        const aViews = a.viewCount || 0;
        const bViews = b.viewCount || 0;
        return bViews - aViews;
      });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedResults = sortedResults.slice(startIndex, startIndex + limit);
    
    return {
      results: paginatedResults,
      total: sortedResults.length,
      page,
      totalPages: Math.ceil(sortedResults.length / limit)
    };
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
  
  // Get creator profile with service
  async getCreatorProfile(creatorId: number) {
    // Get creator info
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });
    
    if (!creator) {
      return null;
    }
    
    // Get creator's service
    const service = await this.getServiceByCreatorId(creatorId);
    
    // Increment view count for the service
    if (service) {
      const viewCount = (service.viewCount || 0) + 1;
      await db.update(services)
        .set({ viewCount })
        .where(eq(services.id, service.id));
    }
    
    return {
      creator,
      service
    };
  }
  
  // Update service with detailed information
  async updateServiceDetails(id: number, data: Partial<ExtendedServiceUpdate>) {
    // Set the last updated timestamp
    const lastUpdated = new Date().toISOString();
    
    // Convert boolean available to number if provided
    const convertedData: Record<string, any> = { ...data, lastUpdated };
    
    if (typeof data.available === 'boolean') {
      convertedData.available = data.available ? 1 : 0;
    }
    
    await db.update(services)
      .set(convertedData)
      .where(eq(services.id, id));
      
    return this.getServiceById(id);
  }
  
  // Toggle service availability
  async toggleServiceAvailability(id: number) {
    const service = await this.getServiceById(id);
    if (!service) return null;
    
    const newAvailable = service.available === 1 ? 0 : 1;
    
    await db.update(services)
      .set({ available: newAvailable })
      .where(eq(services.id, id));
      
    return this.getServiceById(id);
  }
}

export const storage = new Storage();
