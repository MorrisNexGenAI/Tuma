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
      description: "A vibrant city with a rich history and culture, located in western Liberia. Known for its mining heritage and natural beauty.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="40" y="110" fill="#6d28d9" opacity="0.2"/><rect width="60" height="70" x="30" y="70" fill="#6d28d9" opacity="0.7"/><rect width="40" height="50" x="110" y="90" fill="#3b82f6" opacity="0.7"/><rect width="70" height="80" x="170" y="60" fill="#6d28d9" opacity="0.5"/><circle cx="240" cy="30" r="15" fill="#f97316" opacity="0.8"/></svg>`),
    },
    {
      name: "Kakata",
      county: "Margibi County",
      description: "A growing commercial center known for its markets and educational institutions. Located in central Liberia.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="30" y="120" fill="#3b82f6" opacity="0.2"/><rect width="50" height="60" x="40" y="80" fill="#3b82f6" opacity="0.5"/><rect width="30" height="80" x="110" y="60" fill="#6d28d9" opacity="0.6"/><rect width="60" height="70" x="160" y="70" fill="#3b82f6" opacity="0.7"/><circle cx="50" cy="40" r="15" fill="#f97316" opacity="0.8"/></svg>`),
    },
    {
      name: "Monrovia",
      county: "Montserrado County",
      description: "The capital city and economic center of Liberia, featuring diverse neighborhoods and bustling commercial districts.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="35" y="115" fill="#3b82f6" opacity="0.3"/><rect width="25" height="90" x="20" y="50" fill="#6d28d9" opacity="0.6"/><rect width="35" height="110" x="55" y="40" fill="#3b82f6" opacity="0.7"/><rect width="30" height="80" x="100" y="70" fill="#6d28d9" opacity="0.5"/><rect width="40" height="100" x="140" y="50" fill="#3b82f6" opacity="0.6"/><rect width="25" height="70" x="190" y="80" fill="#6d28d9" opacity="0.7"/><rect width="35" height="120" x="225" y="30" fill="#3b82f6" opacity="0.8"/><circle cx="50" cy="25" r="12" fill="#f97316" opacity="0.8"/></svg>`),
    },
    {
      name: "Buchanan",
      county: "Grand Bassa County",
      description: "A coastal city with historic port facilities and beautiful beaches along the Atlantic Ocean.",
      image: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="150" viewBox="0 0 280 150"><rect width="280" height="150" fill="#f0f4ff"/><rect width="280" height="50" y="100" fill="#3b82f6" opacity="0.3"/><path d="M0,100 Q70,85 140,100 Q210,115 280,100 L280,150 L0,150 Z" fill="#3b82f6" opacity="0.5"/><circle cx="70" cy="40" r="20" fill="#f97316" opacity="0.7"/><rect width="40" height="50" x="120" y="80" fill="#6d28d9" opacity="0.6"/><rect width="30" height="40" x="170" y="90" fill="#3b82f6" opacity="0.7"/><rect width="50" height="60" x="210" y="70" fill="#6d28d9" opacity="0.5"/></svg>`),
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
        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-12">
          {/* Background SVG */}
          <div className="absolute inset-0 z-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1200 400">
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6d28d9" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#heroGradient)" />
              <circle cx="200" cy="50" r="120" fill="#ffffff" fillOpacity="0.05" />
              <circle cx="1000" cy="300" r="150" fill="#ffffff" fillOpacity="0.05" />
              <path d="M0,400 C300,320 600,450 1200,350 L1200,400 L0,400 Z" fill="#ffffff" fillOpacity="0.05" />
            </svg>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-8 md:p-12 text-white">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full md:w-3/5 mb-8 md:mb-0">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full mb-4">
                    The #1 Service Directory in Liberia
                  </span>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                    Find Local Services <br />
                    Across <span className="text-white">Liberia</span>
                  </h1>
                  <p className="text-white/90 text-lg mb-8 max-w-md">
                    Discover rooms, restaurants, barbershops and more in Tubmanburg, Monrovia and other regions.
                  </p>
                  
                  {/* Search Component */}
                  <SearchBar className="max-w-xl shadow-lg" />
                  
                  {/* Quick category links */}
                  <div className="flex flex-wrap gap-2 mt-6">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleCategorySelect(category.value)}
                        className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors"
                      >
                        <div className="w-4 h-4 mr-1.5">{category.icon}</div>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="w-full md:w-2/5 flex justify-center">
                  <div className="relative w-64 h-64">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-purple-600/20 backdrop-blur-md rounded-2xl transform -rotate-6"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-600/20 backdrop-blur-md rounded-2xl transform rotate-12"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Popular Categories */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Popular Categories</h2>
            <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-secondary ml-3 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              // Generate different gradient colors for each category
              const gradientClasses = [
                "from-indigo-600 to-blue-400",
                "from-purple-600 to-indigo-400",
                "from-pink-500 to-rose-400",
                "from-orange-500 to-amber-400"
              ];
              
              return (
                <div 
                  key={category.value} 
                  className="relative group rounded-2xl overflow-hidden shadow-md border border-border hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => handleCategorySelect(category.value)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[index]} opacity-90 group-hover:opacity-95 transition-opacity`}></div>
                  
                  <div className="relative z-10 p-6 text-white h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <div className="w-8 h-8">
                        {category.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm text-center">
                      Find {category.name.toLowerCase()} in Liberia
                    </p>
                    
                    <div className="mt-4 bg-white/20 py-1 px-3 rounded-full text-xs inline-flex items-center">
                      <span>Explore</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Featured Locations */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Explore Liberia</h2>
            <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-secondary ml-3 rounded-full"></div>
          </div>
          
          {/* Special highlight for Tubmanburg/Bomi County */}
          <div className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-6 border border-primary/10">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2">
                <div className="relative rounded-xl overflow-hidden shadow-md">
                  <img 
                    src={featuredLocations[0].image} 
                    alt={featuredLocations[0].name} 
                    className="w-full h-60 object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-5 text-white">
                      <span className="inline-block px-3 py-1 bg-primary/80 text-white text-xs rounded-full mb-2">Featured Region</span>
                      <h3 className="font-bold text-2xl drop-shadow-sm">{featuredLocations[0].name}</h3>
                      <div className="flex items-center text-sm mt-1">
                        <MapPin className="h-4 w-4 mr-1.5" />
                        <span>{featuredLocations[0].county}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h3 className="text-xl font-bold text-primary mb-2">Discover {featuredLocations[0].name}</h3>
                <p className="text-text-secondary mb-4">{featuredLocations[0].description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(category => (
                    <div key={category.value} className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <div className="w-4 h-4 text-primary">{category.icon}</div>
                      </div>
                      <span className="text-sm">{category.name} in Bomi</span>
                    </div>
                  ))}
                </div>
                <button 
                  className="mt-4 w-full md:w-auto gradient-bg text-white font-medium py-2.5 px-5 rounded-md hover:shadow-md transition-all flex items-center justify-center"
                  onClick={() => navigate("/search?q=Tubmanburg Bomi")}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore All Services in Bomi County
                </button>
              </div>
            </div>
          </div>
          
          {/* Other locations grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredLocations.slice(1).map((location, index) => (
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
                  <p className="text-text-secondary text-sm line-clamp-2 h-10">{location.description}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <button 
                      className="text-sm text-primary font-medium flex items-center hover:underline" 
                      onClick={() => navigate(`/search?q=${location.name} ${location.county}`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Explore services
                    </button>
                    {index === 0 && (
                      <span className="flex items-center text-xs text-primary font-medium">
                        <Star className="h-3.5 w-3.5 mr-1 text-yellow-500" /> 
                        Popular
                      </span>
                    )}
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
