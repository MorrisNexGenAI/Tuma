import { useState, FormEvent, useEffect } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

type SearchBarProps = {
  initialQuery?: string;
  className?: string;
  variant?: "default" | "compact";
  onSearch?: (query: string) => void;
};

const SearchBar = ({ 
  initialQuery = "", 
  className = "", 
  variant = "default",
  onSearch
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [, navigate] = useLocation();

  // Handle any updates to initialQuery prop
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // Use different styling based on variant
  const isCompact = variant === "compact";

  return (
    <div className={`${isCompact ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} rounded-lg shadow-md ${isCompact ? 'p-2' : 'p-4'} ${className}`}>
      <form onSubmit={handleSubmit} className={`${isCompact ? 'flex' : 'flex flex-col space-y-4'}`}>
        <div className={`${isCompact ? 'flex-1 relative' : 'w-full'}`}>
          {!isCompact && (
            <label htmlFor="searchQuery" className="block text-sm font-medium text-text-secondary mb-1">
              What are you looking for?
            </label>
          )}
          <input 
            type="text" 
            id="searchQuery" 
            placeholder={isCompact ? "Search services..." : "e.g. Room in Tubmanburg, Restaurant in Monrovia"} 
            className={`w-full text-text-primary ${isCompact ? 'p-2' : 'p-3'} border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          className={`gradient-bg text-white font-medium ${isCompact ? 'ml-2 px-3 py-2' : 'py-3 px-4'} rounded-md flex justify-center items-center whitespace-nowrap`}
        >
          <Search className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} ${isCompact ? '' : 'mr-2'}`} />
          {!isCompact && <span>Search Services</span>}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
