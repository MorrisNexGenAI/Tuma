import { Service } from "@shared/schema";
import { MapPin, Clock, Phone, Tag, User, Info, DollarSign, Calendar, Eye, ToggleRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

type ServiceCardProps = {
  service: Service;
  showDetailed?: boolean;
};

const ServiceCard = ({ service, showDetailed = false }: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    id,
    creatorId,
    name, 
    serviceType, 
    phone, 
    county, 
    city, 
    community, 
    description,
    detailedDescription,
    features,
    pricing,
    images,
    operatingHours, 
    available,
    viewCount = null,
    tags,
    lastUpdated
  } = service;

  // Format location string
  const location = [community, city, county].filter(Boolean).join(', ');
  const phoneFormatted = phone.startsWith('+') ? phone : `+231 ${phone}`;
  
  // Parse images if available
  let imagesList: string[] = [];
  if (images) {
    try {
      imagesList = JSON.parse(images);
    } catch (e) {
      console.error("Failed to parse service images:", e);
    }
  }
  
  // Parse features if available
  let featuresList: string[] = [];
  if (features) {
    try {
      featuresList = JSON.parse(features);
    } catch (e) {
      // Handle as string if not proper JSON
      if (typeof features === 'string' && features.trim()) {
        featuresList = [features];
      }
    }
  }
  
  // Parse tags if available
  let tagsList: string[] = [];
  if (tags) {
    try {
      tagsList = JSON.parse(tags);
    } catch (e) {
      // Handle as string if not proper JSON
      if (typeof tags === 'string' && tags.trim()) {
        tagsList = tags.split(',').map(t => t.trim());
      }
    }
  }
  
  // Format last updated
  let formattedDate = '';
  if (lastUpdated) {
    try {
      const date = new Date(lastUpdated);
      formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      formattedDate = lastUpdated;
    }
  }
  
  // Generate random gradient background for service type badge
  const serviceTypeColors = {
    'Room': 'from-indigo-600 to-blue-400',
    'Restaurant': 'from-orange-500 to-amber-400',
    'Barbershop': 'from-purple-600 to-indigo-400',
    'Salon': 'from-pink-500 to-rose-400'
  } as {[key: string]: string};
  
  const gradientClass = serviceTypeColors[serviceType] || 'from-primary to-secondary';
  
  return (
    <div className="service-card bg-white rounded-xl shadow-md border border-border hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Image section */}
      {imagesList.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imagesList[0]} 
            alt={name} 
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white">
              <h3 className="font-bold text-xl drop-shadow-sm">{name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {tagsList.map((tag, index) => (
                  <span key={index} className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/30 text-white backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-5">
        {/* Only show title if no images */}
        {imagesList.length === 0 && (
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-xl">{name}</h3>
              <div className="flex items-center mt-1">
                <Tag size={14} className="text-primary mr-1.5" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${gradientClass} text-white`}>
                  {serviceType}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {available === 1 ? (
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20">
                    Available
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                  <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                    Unavailable
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show availability indicator if we have images */}
        {imagesList.length > 0 && (
          <div className="flex items-center justify-end mb-2">
            {available === 1 ? (
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-600 text-xs font-medium">Available Now</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="text-gray-600 text-xs font-medium">Unavailable</span>
              </div>
            )}
          </div>
        )}
        
        {/* Description (truncated) */}
        {(description || detailedDescription) && (
          <div className="mb-3">
            <p className="text-sm text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors duration-300">
              {detailedDescription || description}
            </p>
          </div>
        )}
        
        {/* Location and operating hours */}
        <div className="mb-4 space-y-2 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary">{location}</span>
          </div>
          <div className="flex items-start">
            <Clock className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary">{operatingHours || 'Hours not specified'}</span>
          </div>
          {pricing && (
            <div className="flex items-start">
              <DollarSign className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm text-text-secondary">{pricing}</span>
            </div>
          )}
        </div>
        
        {/* Expandable features section */}
        {featuresList.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left px-3 py-2 bg-primary/5 hover:bg-primary/10 rounded-md transition-all"
            >
              <span className="text-sm font-medium text-primary flex items-center">
                <Info className="w-4 h-4 mr-1.5" />
                Features & Highlights
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            
            {isExpanded && (
              <ul className="mt-2 space-y-1 pl-2">
                {featuresList.map((feature, index) => (
                  <li key={index} className="text-sm text-text-secondary flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* Service stats */}
        <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
          {viewCount !== undefined && viewCount !== null && viewCount > 0 && (
            <span className="flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {viewCount} views
            </span>
          )}
          
          {lastUpdated && (
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Updated {formattedDate}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Contact button */}
          <a 
            href={`tel:${phone}`}
            className="gradient-bg py-2.5 px-4 rounded-md font-medium text-center text-white transition-all hover:shadow-md flex-1"
          >
            <div className="flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2" />
              {phoneFormatted}
            </div>
          </a>
          
          {/* Creator Profile button */}
          <Link 
            to={`/creators/${creatorId}`}
            className="bg-primary/10 hover:bg-primary/20 text-primary py-2.5 px-3 rounded-md font-medium text-center transition-all flex items-center justify-center"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
