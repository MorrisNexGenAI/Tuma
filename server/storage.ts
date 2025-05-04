import { db } from "@db";
import { 
  creators, 
  services, 
  Service, 
  ProfileUpdate, 
  ExtendedServiceUpdate, 
  analyticsEvents, 
  serviceStats,
  admins,
  announcements,
  adminLogs,
  SystemStats,
  Admin,
  Announcement
} from "@shared/schema";
import { eq, and, like, or, desc, asc, sql, ilike, gte, lte, count } from "drizzle-orm";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";

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
  
  // Analytics methods
  async trackEvent(serviceId: number, eventType: string, data: Record<string, any> = {}, userInfo: Record<string, any> = {}) {
    try {
      // Generate a session ID if not provided
      const sessionId = userInfo.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Insert event into analytics_events table
      const [event] = await db.insert(analyticsEvents).values({
        serviceId,
        eventType,
        eventData: JSON.stringify(data),
        userLocation: userInfo.location || null,
        userAgent: userInfo.userAgent || null,
        sessionId
      }).returning();
      
      // Update service stats
      await this.updateServiceStats(serviceId, eventType, userInfo);
      
      return event;
    } catch (error) {
      console.error("Error tracking event:", error);
      // Don't throw - analytics errors shouldn't break the main application flow
      return null;
    }
  }
  
  async updateServiceStats(serviceId: number, eventType: string, userInfo: Record<string, any> = {}) {
    try {
      // Check if stats record exists for this service
      const existing = await db.query.serviceStats.findFirst({
        where: eq(serviceStats.serviceId, serviceId)
      });
      
      const today = new Date();
      const dayKey = format(today, 'yyyy-MM-dd');
      const hourKey = format(today, 'HH');
      const location = userInfo.location || 'unknown';
      
      if (!existing) {
        // Create new stats record
        const initialStats = {
          totalViews: eventType === 'view' ? 1 : 0,
          contactClicks: eventType === 'contact_click' ? 1 : 0,
          viewsByDay: JSON.stringify({ [dayKey]: 1 }),
          viewsByHour: JSON.stringify({ [hourKey]: 1 }),
          locationBreakdown: JSON.stringify({ [location]: 1 }),
        };
        
        await db.insert(serviceStats).values({
          serviceId,
          ...initialStats
        });
        
        return;
      }
      
      // Update existing stats
      let updates: Record<string, any> = {};
      
      // Update total counters
      if (eventType === 'view') {
        updates.totalViews = (existing.totalViews || 0) + 1;
      } else if (eventType === 'contact_click') {
        updates.contactClicks = (existing.contactClicks || 0) + 1;
      }
      
      // Update daily views
      if (eventType === 'view') {
        const viewsByDay = existing.viewsByDay ? JSON.parse(existing.viewsByDay) : {};
        viewsByDay[dayKey] = (viewsByDay[dayKey] || 0) + 1;
        updates.viewsByDay = JSON.stringify(viewsByDay);
      }
      
      // Update hourly views
      if (eventType === 'view') {
        const viewsByHour = existing.viewsByHour ? JSON.parse(existing.viewsByHour) : {};
        viewsByHour[hourKey] = (viewsByHour[hourKey] || 0) + 1;
        updates.viewsByHour = JSON.stringify(viewsByHour);
      }
      
      // Update location breakdown
      if (location) {
        const locationBreakdown = existing.locationBreakdown ? JSON.parse(existing.locationBreakdown) : {};
        locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;
        updates.locationBreakdown = JSON.stringify(locationBreakdown);
      }
      
      // Update lastUpdated timestamp
      updates.lastUpdated = new Date();
      
      // Apply updates
      await db.update(serviceStats)
        .set(updates)
        .where(eq(serviceStats.id, existing.id));
    } catch (error) {
      console.error("Error updating service stats:", error);
      // Don't throw - analytics errors shouldn't break the main application flow
    }
  }
  
  async getServiceAnalytics(serviceId: number, timeframe: 'week' | 'month' | 'all' = 'week') {
    try {
      // Get service stats
      const stats = await db.query.serviceStats.findFirst({
        where: eq(serviceStats.serviceId, serviceId)
      });
      
      if (!stats) {
        // Return empty analytics data
        return {
          viewsHistory: [],
          totalViews: 0,
          contactClicks: 0,
          viewsGrowth: 0,
          peakHours: [],
          popularDays: [],
          locationBreakdown: []
        };
      }
      
      // Parse JSON data
      const viewsByDay = stats.viewsByDay ? JSON.parse(stats.viewsByDay) : {};
      const viewsByHour = stats.viewsByHour ? JSON.parse(stats.viewsByHour) : {};
      const locationData = stats.locationBreakdown ? JSON.parse(stats.locationBreakdown) : {};
      
      // Current date for period calculations
      const today = new Date();
      
      // Calculate date range based on timeframe
      let startDate = today;
      if (timeframe === 'week') {
        startDate = subDays(today, 7);
      } else if (timeframe === 'month') {
        startDate = subMonths(today, 1);
      } else {
        // For 'all', we'll use all available data
      }
      
      // Format start date
      const startDateStr = timeframe !== 'all' ? format(startDate, 'yyyy-MM-dd') : '';
      
      // Filter data by timeframe if needed
      const filteredDailyData = timeframe === 'all' 
        ? viewsByDay 
        : Object.entries(viewsByDay)
            .filter(([date]) => date >= startDateStr)
            .reduce((acc, [date, views]) => {
              acc[date] = views;
              return acc;
            }, {} as Record<string, number>);
      
      // Format daily views for chart
      const viewsHistory = Object.entries(filteredDailyData).map(([date, views]) => {
        // Format date for display (e.g., "Mon", "Tue" for week view)
        const displayDate = timeframe === 'week' 
          ? format(new Date(date), 'EEE') 
          : format(new Date(date), timeframe === 'month' ? 'dd MMM' : 'yyyy-MM-dd');
          
        return { date: displayDate, views: Number(views) };
      });
      
      // Sort by date
      viewsHistory.sort((a, b) => {
        // This simple comparison might be inadequate for complex date formats
        // For now, we'll leave it this way and adjust if needed
        return a.date.localeCompare(b.date);
      });
      
      // Calculate growth percentage compared to previous period
      const totalCurrentViews = Object.values(filteredDailyData).reduce((sum, views) => sum + (views as number), 0);
      
      // Calculate previous period for comparison
      let prevStartDate = startDate;
      if (timeframe === 'week') {
        prevStartDate = subDays(startDate, 7);
      } else if (timeframe === 'month') {
        prevStartDate = subMonths(startDate, 1);
      }
      
      const prevEndDateStr = timeframe !== 'all' ? format(subDays(startDate, 1), 'yyyy-MM-dd') : '';
      const prevStartDateStr = timeframe !== 'all' ? format(prevStartDate, 'yyyy-MM-dd') : '';
      
      // Calculate previous period views
      const prevPeriodViews = timeframe === 'all' 
        ? 0 // No comparison for all-time 
        : Object.entries(viewsByDay)
            .filter(([date]) => date >= prevStartDateStr && date <= prevEndDateStr)
            .reduce((sum, [_, views]) => sum + (views as number), 0);
      
      // Calculate growth percentage
      const viewsGrowth = prevPeriodViews === 0 
        ? 100 // If no previous views, consider it 100% growth
        : Math.round(((totalCurrentViews - prevPeriodViews) / prevPeriodViews) * 100);
      
      // Format hourly data for chart
      const peakHours = Object.entries(viewsByHour).map(([hour, views]) => {
        // Format hour for display (e.g., "8-10 AM")
        const hourNum = parseInt(hour);
        const displayHour = `${hourNum}-${(hourNum + 2) % 24} ${hourNum < 12 ? 'AM' : 'PM'}`;
        
        return { hour: displayHour, views: Number(views) };
      });
      
      // Sort by views (descending)
      peakHours.sort((a, b) => b.views - a.views);
      
      // Calculate day of week popularity
      const dayOfWeekMap: Record<string, number> = {
        'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
      };
      
      // Aggregate views by day of week
      Object.entries(viewsByDay).forEach(([dateStr, views]) => {
        try {
          const date = new Date(dateStr);
          const dayOfWeek = format(date, 'EEE');
          dayOfWeekMap[dayOfWeek] = (dayOfWeekMap[dayOfWeek] || 0) + (views as number);
        } catch (e) {
          console.error(`Error parsing date: ${dateStr}`, e);
        }
      });
      
      // Convert to array for chart
      const popularDays = Object.entries(dayOfWeekMap)
        .map(([day, views]) => ({ day, views: Number(views) }))
        .sort((a, b) => b.views - a.views); // Sort by popularity
      
      // Format location data
      const totalLocationViews = Object.values(locationData).reduce((sum, views) => sum + (views as number), 0);
      
      const locationBreakdown = Object.entries(locationData)
        .map(([location, views]) => {
          const percentage = totalLocationViews === 0 
            ? 0 
            : Math.round((Number(views) / totalLocationViews) * 100);
            
          return { location, percentage };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5); // Top 5 locations
      
      // Return formatted analytics data
      return {
        viewsHistory,
        totalViews: stats.totalViews || 0,
        contactClicks: stats.contactClicks || 0,
        viewsGrowth,
        peakHours,
        popularDays,
        locationBreakdown
      };
    } catch (error) {
      console.error("Error retrieving service analytics:", error);
      
      // Return empty analytics data on error
      return {
        viewsHistory: [],
        totalViews: 0,
        contactClicks: 0,
        viewsGrowth: 0,
        peakHours: [],
        popularDays: [],
        locationBreakdown: []
      };
    }
  }
  
  // Admin methods
  async getAdminByPhone(phone: string) {
    const admin = await db.query.admins.findFirst({
      where: eq(admins.phone, phone),
    });
    
    return admin;
  }
  
  async createAdmin(fullName: string, phone: string, pin: string) {
    const [admin] = await db.insert(admins)
      .values({
        fullName,
        phone,
        pin,
        role: "admin",
        isActive: true,
      })
      .returning();
      
    return admin;
  }
  
  async updateAdminLastLogin(adminId: number) {
    await db.update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, adminId));
  }
  
  async createAnnouncement(adminId: number, data: Omit<typeof announcements.$inferInsert, "id" | "adminId" | "createdAt">) {
    const [announcement] = await db.insert(announcements)
      .values({
        ...data,
        adminId,
      })
      .returning();
      
    return announcement;
  }
  
  async getActiveAnnouncements() {
    return db.select()
      .from(announcements)
      .where(
        and(
          eq(announcements.isActive, true),
          or(
            sql`${announcements.endDate} IS NULL`,
            sql`${announcements.endDate} > NOW()`
          )
        )
      )
      .orderBy(desc(announcements.createdAt));
  }
  
  async updateAnnouncement(id: number, data: Partial<typeof announcements.$inferInsert>) {
    await db.update(announcements)
      .set(data)
      .where(eq(announcements.id, id));
  }
  
  async deleteAnnouncement(id: number) {
    await db.delete(announcements)
      .where(eq(announcements.id, id));
  }
  
  async logAdminAction(adminId: number, action: string, targetType: string, targetId?: number, details?: string) {
    await db.insert(adminLogs)
      .values({
        adminId,
        action,
        targetType,
        targetId,
        details,
      });
  }
  
  async getAdminLogs(limit = 100) {
    return db.select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.timestamp))
      .limit(limit);
  }
  
  async getSystemStats(): Promise<SystemStats> {
    // Get total creators
    const [totalCreatorsResult] = await db.select({ count: count() })
      .from(creators);
      
    const totalCreators = Number(totalCreatorsResult?.count) || 0;
    
    // Get total services 
    const [totalServicesResult] = await db.select({ count: count() })
      .from(services);
      
    const totalServices = Number(totalServicesResult?.count) || 0;
    
    // Get new creators today
    const today = new Date();
    // This is a placeholder since we don't have a proper timestamp
    // In a real system, we would query based on the creation timestamp
    const newCreatorsToday = 0; 
    
    // Get active creators (with at least one service)
    const [activeCreatorsResult] = await db.select({ count: count(services.creatorId, { distinct: true }) })
      .from(services);
      
    const activeCreators = Number(activeCreatorsResult?.count) || 0;
    
    // Total views across all services
    const totalViews = await this.getTotalServiceViews();
    
    // Daily views (approximate from analytics, this would be more precise in a real system)
    const dailyViews = Math.round(totalViews / 30) || 0; // Rough estimate 
    
    // Get populated counties distribution
    const countiesResults = await db.select({
      county: services.county,
      count: count(),
    })
    .from(services)
    .groupBy(services.county)
    .orderBy(desc(sql`count`));
    
    const populatedCounties = countiesResults.map(row => ({
      name: row.county,
      count: Number(row.count)
    }));
    
    // Get service type distribution
    const serviceTypesResults = await db.select({
      type: services.serviceType,
      count: count(),
    })
    .from(services)
    .groupBy(services.serviceType)
    .orderBy(desc(sql`count`));
    
    const serviceTypeDistribution = serviceTypesResults.map(row => ({
      type: row.type,
      count: Number(row.count)
    }));
    
    // Mock creator growth data as we don't have historical data
    // In a real application, this would come from a proper time series query
    const creatorGrowthData = [
      { date: format(subDays(today, 30), 'MM/dd'), count: Math.round(totalCreators * 0.7) },
      { date: format(subDays(today, 25), 'MM/dd'), count: Math.round(totalCreators * 0.75) },
      { date: format(subDays(today, 20), 'MM/dd'), count: Math.round(totalCreators * 0.8) },
      { date: format(subDays(today, 15), 'MM/dd'), count: Math.round(totalCreators * 0.85) },
      { date: format(subDays(today, 10), 'MM/dd'), count: Math.round(totalCreators * 0.9) },
      { date: format(subDays(today, 5), 'MM/dd'), count: Math.round(totalCreators * 0.95) },
      { date: format(today, 'MM/dd'), count: totalCreators }
    ];
      
    return {
      totalCreators,
      activeCreators,
      totalServices,
      newCreatorsToday,
      dailyViews,
      totalViews,
      populatedCounties,
      serviceTypeDistribution,
      creatorGrowthData
    };
  }
  
  // Helper method to get total views across all services
  async getTotalServiceViews() {
    const [result] = await db.select({
      total: sql<number>`SUM(${services.viewCount})`
    })
    .from(services);
    
    return Number(result?.total) || 0;
  }
  
  // Get login activity for admin dashboard
  async getLoginActivity(days = 30) {
    // In a real system, this would query login events
    // Since we don't have login tracking yet, we'll return a simple structure
    const today = new Date();
    const activityData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = subDays(today, i);
      activityData.push({
        date: format(date, 'MM/dd'),
        logins: Math.floor(Math.random() * 10) + 1, // Random 1-10 for demo
      });
    }
    
    return activityData;
  }
  
  // Warning system for creators
  async warnCreator(creatorId: number, message: string, adminId: number) {
    // In a real system, we'd have a separate warnings table
    // For now, we'll log it as an admin action
    await this.logAdminAction(
      adminId,
      "warn_creator",
      "creator",
      creatorId,
      message
    );
    
    return true;
  }
}

export const storage = new Storage();
