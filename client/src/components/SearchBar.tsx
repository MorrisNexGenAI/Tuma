import { useState, FormEvent } from "react";
import { useLocation } from "wouter";

type SearchBarProps = {
  initialQuery?: string;
  className?: string;
};

const SearchBar = ({ initialQuery = "", className = "" }: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [, navigate] = useLocation();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-text-secondary mb-1">
            What are you looking for?
          </label>
          <input 
            type="text" 
            id="searchQuery" 
            placeholder="e.g. Room in Sinkor, Restaurant in Paynesville" 
            className="w-full p-3 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          className="btn-primary py-3 px-4 rounded-md font-medium flex justify-center items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Search Services
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
