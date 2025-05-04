import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ServiceCard from "@/components/ServiceCard";
import { Service } from "@shared/schema";

const SearchResults = () => {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);

  // Parse query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);
    
    // Extract potential filters from query
    if (query) {
      const terms = query.toLowerCase().split(/\s+/);
      const potentialFilters = terms.filter(term => term.length > 2);
      setFilters(potentialFilters);
    }
  }, [location]);

  // Query search results
  const { data: searchResults = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  // Handle filter removal
  const removeFilter = (filter: string) => {
    const newQuery = searchQuery
      .split(/\s+/)
      .filter(term => term.toLowerCase() !== filter.toLowerCase())
      .join(" ");
    
    setSearchQuery(newQuery);
    window.history.pushState(
      {}, 
      "", 
      `/search?q=${encodeURIComponent(newQuery)}`
    );
  };

  // Handle filter search form submission
  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState(
      {}, 
      "", 
      `/search?q=${encodeURIComponent(searchQuery)}`
    );
  };

  // Group services by type for better categorization
  const servicesByType = searchResults.reduce((acc, service) => {
    const type = service.serviceType || "Other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Get all unique service types from results
  const serviceTypes = Object.keys(servicesByType);
  
  return (
    <div className="container mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Link href="/" className="flex items-center text-text-secondary hover:text-primary">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Home
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-1">
          Results for "{searchQuery}"
        </h1>
        <p className="text-text-secondary">
          Found {searchResults.length} services
        </p>
      </div>
      
      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleFilterSearch} className="flex flex-col space-y-4">
          <div>
            <label htmlFor="filterQuery" className="block text-sm font-medium text-text-secondary mb-1">
              What are you looking for?
            </label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                id="filterQuery" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
              <button 
                type="submit" 
                className="btn-primary py-2 px-4 rounded-md font-medium flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Service type quick filters */}
          {serviceTypes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map(type => (
                <a 
                  key={type} 
                  href={`#${type.toLowerCase()}-section`}
                  className="inline-flex items-center bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20"
                >
                  <span className="text-sm font-medium text-primary">{type}s</span>
                </a>
              ))}
            </div>
          )}
          
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <div key={filter} className="inline-flex items-center bg-background px-3 py-1.5 rounded-full">
                  <span className="text-sm font-medium mr-1">{filter}</span>
                  <button 
                    type="button" 
                    className="text-text-secondary"
                    onClick={() => removeFilter(filter)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
      
      {/* Search Results List */}
      <div id="search-results">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="service-card">
                <div className="p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-md">
            <svg 
              className="w-12 h-12 text-text-secondary mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-text-secondary mb-4">
              We couldn't find any services matching your search. Try different keywords or browse categories.
            </p>
            <Link 
              href="/" 
              className="btn-primary inline-block py-2 px-4 rounded-md"
            >
              Browse All Services
            </Link>
          </div>
        ) : serviceTypes.length > 1 ? (
          // Display grouped by service type when we have multiple types
          <div className="space-y-8">
            {serviceTypes.map(type => (
              <div key={type} id={`${type.toLowerCase()}-section`} className="bg-white rounded-lg p-4 shadow-sm">
                <h2 className="text-xl font-bold mb-4 px-2 py-1 border-l-4 border-primary">
                  {type}s
                  <span className="text-sm font-normal text-text-secondary ml-2">
                    ({servicesByType[type].length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servicesByType[type].map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Simple display for single type results
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
