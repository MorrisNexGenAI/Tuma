import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useEffect } from "react";
import { getQueryFn } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Phone, MapPin, Clock, Mail, Tag, Calendar, ExternalLink, ArrowLeft, User2, Star, ToggleLeft, ToggleRight } from "lucide-react";
import ServiceCard from "../components/ServiceCard";

interface CreatorProfileRouteParams {
  id: string;
}

const CreatorProfile = () => {
  const { id } = useParams<CreatorProfileRouteParams>();
  const creatorId = parseInt(id);
  const { toast } = useToast();
  
  // Fetch creator profile 
  const { data, isLoading, error } = useQuery<{ 
    creator?: {
      id: number;
      phone: string; 
      profileImage?: string;
      fullName?: string;
      bio?: string;
      followers?: number;
      joinedDate?: string;
      socialLinks?: string;
      rating?: string;
    };
    service?: any;
  }>({
    queryKey: ['/api/creators', creatorId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isNaN(creatorId)
  });
  
  // Show error toast if fetch fails
  useEffect(() => {
    if (error) {
      console.error("Creator profile error:", error);
      toast({
        title: "Error",
        description: "Failed to load creator profile",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Log data for debugging
  useEffect(() => {
    if (data) {
      console.log("Creator profile data:", data);
    }
  }, [data]);
  
  // Handle creator not found
  if (!isLoading && (!data || !data.creator)) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Creator Not Found</h1>
          <p className="text-text-secondary mb-6">The creator profile you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="inline-flex items-center text-primary font-medium hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  const creator = data?.creator;
  const service = data?.service;
  
  // Parse social links if available
  let socialLinks: Record<string, string> = {};
  if (creator?.socialLinks) {
    try {
      socialLinks = JSON.parse(creator.socialLinks);
    } catch (e) {
      console.error("Failed to parse social links:", e);
    }
  }
  
  // Parse rating if available
  let rating = { average: 0, count: 0 };
  if (creator?.rating) {
    try {
      rating = JSON.parse(creator.rating);
    } catch (e) {
      console.error("Failed to parse rating:", e);
    }
  }
  
  // Format joined date
  let formattedJoinedDate = '';
  if (creator?.joinedDate) {
    try {
      const date = new Date(creator.joinedDate);
      formattedJoinedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      formattedJoinedDate = creator.joinedDate;
    }
  } else {
    formattedJoinedDate = 'Recently joined';
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {isLoading ? (
        // Loading skeleton
        <div className="animate-pulse">
          <div className="flex items-start gap-8 mb-8">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
        </div>
      ) : (
        <>
          {/* Back button */}
          <Link to="/" className="inline-flex items-center text-primary font-medium hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          {/* Creator profile header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary/20 to-secondary/10 p-8 relative">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Profile image */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                  {creator?.profileImage ? (
                    <img src={creator.profileImage} alt={creator.fullName || `Creator ${creatorId}`} className="w-full h-full object-cover" />
                  ) : (
                    <User2 className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                
                {/* Creator info */}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-2xl font-bold">{creator?.fullName || (service ? service.name : `Creator ${creatorId}`)}</h1>
                    {service?.available === 1 && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        <ToggleRight className="h-3.5 w-3.5" />
                        <span>Available</span>
                      </div>
                    )}
                    {service?.available === 0 && (
                      <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        <ToggleLeft className="h-3.5 w-3.5" />
                        <span>Unavailable</span>
                      </div>
                    )}
                  </div>
                  
                  {service && (
                    <div className="flex items-center mt-1 mb-2">
                      <Tag size={14} className="text-primary mr-1.5" />
                      <span className="text-sm font-medium text-primary">{service.serviceType}</span>
                    </div>
                  )}
                  
                  {creator?.bio && (
                    <p className="text-text-secondary mb-4 max-w-2xl">{creator.bio}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-text-secondary gap-4 mb-2">
                    {formattedJoinedDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-primary" />
                        <span>Joined {formattedJoinedDate}</span>
                      </div>
                    )}
                    
                    {creator?.followers !== undefined && creator.followers > 0 && (
                      <div className="flex items-center">
                        <User2 className="h-4 w-4 mr-1.5 text-primary" />
                        <span>{creator.followers} followers</span>
                      </div>
                    )}
                    
                    {rating.count > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1.5 text-primary" />
                        <span>{rating.average.toFixed(1)} ({rating.count} reviews)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Contact options */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {service && (
                      <a 
                        href={`tel:${service.phone}`}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contact
                      </a>
                    )}
                    
                    {/* Social links */}
                    {Object.entries(socialLinks).length > 0 && (
                      <div className="flex items-center gap-2">
                        {Object.entries(socialLinks).map(([platform, url]) => (
                          <a 
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            {platform}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service details */}
            {service && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-medium mb-2">Service Details</h2>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">
                        {[service.community, service.city, service.county].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    {service.operatingHours && (
                      <div className="flex items-start">
                        <Clock className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-text-secondary">{service.operatingHours}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Service description */}
                  {(service.description || service.detailedDescription) && (
                    <div>
                      <h2 className="text-lg font-medium mb-2">About this service</h2>
                      <p className="text-sm text-text-secondary">
                        {service.detailedDescription || service.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Service card (if available) */}
          {service && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Service</h2>
              <div className="max-w-xl">
                <ServiceCard service={service} showDetailed={true} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreatorProfile;