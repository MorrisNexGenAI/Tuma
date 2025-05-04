import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import { useLocation } from "wouter";
import ServiceCard from "@/components/ServiceCard";
import SearchBar from "@/components/SearchBar";

// Category info type
type Category = {
  name: string;
  value: string;
  icon: JSX.Element;
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
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      ),
    },
    {
      name: "Restaurants",
      value: "Restaurant",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      ),
    },
    {
      name: "Barbershops",
      value: "Barbershop",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
    },
    {
      name: "Salons",
      value: "Salon",
      icon: (
        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path>
        </svg>
      ),
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
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Services in Liberia</h1>
        <p className="text-text-secondary mb-6">Search for rooms, restaurants, barbershops and more.</p>
        
        {/* Search Component */}
        <SearchBar className="mb-6" />
        
        {/* Popular Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <div 
                key={category.value} 
                className="category-card"
                onClick={() => handleCategorySelect(category.value)}
              >
                <div className="category-icon">
                  {category.icon}
                </div>
                <span className="font-medium text-sm">{category.name}</span>
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
