import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import { useLocation } from "wouter";
import ServiceCard from "@/components/ServiceCard";
import SearchBar from "@/components/SearchBar";
import { Home as HomeIcon, Utensils, Scissors, Sparkles, Building, MapPin, Star, TrendingUp } from "lucide-react";

// Category info type
type Category = {
  name: string;
  value: string;
  icon: JSX.Element;
};

// Featured Location type
type FeaturedLocation = {
  name: string;
  county: string;
  description: string;
  image: string;
};

const Home = () => {
  const [, navigate] = useLocation();
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Function to get URL parameters
  const getQueryParams = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return {
        category: params.get("category"),
      };
    }
    return { category: null };
  };

  // Get category from URL on component mount
  useEffect(() => {
    const { category } = getQueryParams();
    if (category) {
      setSelectedCategory(category);
    }
  }, []);

  // Categories with icons
  const categories: Category[] = [
    {
      name: "Rooms",
      value: "Room",
      icon: <HomeIcon className="w-6 h-6 text-white" />,
    },
    {
      name: "Restaurants",
      value: "Restaurant",
      icon: <Utensils className="w-6 h-6 text-white" />,
    },
    {
      name: "Barbershops",
      value: "Barbershop",
      icon: <Scissors className="w-6 h-6 text-white" />,
    },
    {
      name: "Salons",
      value: "Salon",
      icon: <Sparkles className="w-6 h-6 text-white" />,
    },
  ];
  
  // Featured locations data
  const featuredLocations: FeaturedLocation[] = [
    {
      name: "Tubmanburg",
      county: "Bomi County",
      description: "A vibrant city with a rich history and culture, located in western Liberia.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="40" y="110" fill="#6d28d9" opacity="0.2"/><rect width="60" height="70" x="30" y="70" fill="#6d28d9" opacity="0.7"/><rect width="40" height="50" x="110" y="90" fill="#3b82f6" opacity="0.7"/><rect width="70" height="80" x="170" y="60" fill="#6d28d9" opacity="0.5"/><circle cx="240" cy="30" r="15" fill="#f97316" opacity="0.8"/></svg>`),
    },
    {
      name: "Kakata",
      county: "Margibi County",
      description: "A growing commercial center known for its markets and educational institutions.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="30" y="120" fill="#3b82f6" opacity="0.2"/><rect width="50" height="60" x="40" y="80" fill="#3b82f6" opacity="0.5"/><rect width="30" height="80" x="110" y="60" fill="#6d28d9" opacity="0.6"/><rect width="60" height="70" x="160" y="70" fill="#3b82f6" opacity="0.7"/><circle cx="50" cy="40" r="15" fill="#f97316" opacity="0.8"/></svg>`),
    },
  ];

  // Query services from API
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: [
      "/api/services", 
      { sort: sortOrder, page: currentPage, category: selectedCategory }
    ],
  });

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    navigate(`/?category=${category}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 fade-in">
      <section className="mb-12">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-3">Find Services in Liberia</h1>
          <p className="text-white/90 text-lg mb-6">Search for rooms, restaurants, barbershops and more.</p>
          
          {/* Search Component */}
          <SearchBar className="max-w-2xl" />
        </div>
        
        {/* Popular Categories */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Categories</h2>
            <div className="h-1 w-10 bg-accent ml-3 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map((category) => (
              <div 
                key={category.value} 
                className="category-card"
                onClick={() => handleCategorySelect(category.value)}
              >
                <div className="category-icon">
                  {category.icon}
                </div>
                <span className="font-semibold">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Featured Locations */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Locations</h2>
            <div className="h-1 w-10 bg-accent ml-3 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredLocations.map((location, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md border border-border hover:shadow-lg transition-all">
                <div className="relative h-40">
                  <img src={location.image} alt={location.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="font-bold text-xl">{location.name}</h3>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{location.county}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-text-secondary">{location.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="flex items-center text-sm text-secondary font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Explore services in this area
                    </span>
                    <span className="flex items-center text-sm text-primary font-medium">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" /> 
                      Popular
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Service Listings */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedCategory ? `${selectedCategory}s` : "Available Services"}
          </h2>
          <div className="flex items-center space-x-2">
            <label htmlFor="sortOrder" className="text-sm text-text-secondary">Sort by:</label>
            <select
              id="sortOrder"
              className="text-sm border border-border rounded-md p-1 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="closest">Closest</option>
            </select>
          </div>
        </div>
        
        {/* Service Cards Container */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <h3 className="text-lg font-medium mb-2">No services found</h3>
            <p className="text-text-secondary">
              {selectedCategory 
                ? `No ${selectedCategory.toLowerCase()} services are currently available.` 
                : "No services are currently available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {services.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-1">
              <button 
                className={`border border-border rounded-md px-3 py-1 ${
                  currentPage === 1 
                    ? "text-text-secondary opacity-50 cursor-not-allowed" 
                    : "text-text-secondary hover:bg-primary hover:text-white transition-colors"
                }`}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                &laquo; Prev
              </button>
              
              {[1, 2, 3].map((page) => (
                <button 
                  key={page}
                  className={`border border-border rounded-md px-3 py-1 ${
                    currentPage === page 
                      ? "bg-primary text-white" 
                      : "text-text-secondary hover:bg-primary hover:text-white transition-colors"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="border border-border rounded-md px-3 py-1 text-text-secondary hover:bg-primary hover:text-white transition-colors"
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
