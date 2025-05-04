import { Service } from "@shared/schema";
import { MapPin, Clock, Phone, Tag } from "lucide-react";

type ServiceCardProps = {
  service: Service;
};

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { 
    name, 
    serviceType, 
    phone, 
    county, 
    city, 
    community, 
    operatingHours, 
    available 
  } = service;

  // Format location string
  const location = [community, city, county].filter(Boolean).join(', ');
  const phoneFormatted = phone.startsWith('+') ? phone : `+231 ${phone}`;
  
  // Generate random gradient background for service type badge
  const serviceTypeColors = {
    'Room': 'from-indigo-600 to-blue-400',
    'Restaurant': 'from-orange-500 to-amber-400',
    'Barbershop': 'from-purple-600 to-indigo-400',
    'Salon': 'from-pink-500 to-rose-400'
  } as {[key: string]: string};
  
  const gradientClass = serviceTypeColors[serviceType] || 'from-primary to-secondary';
  
  return (
    <div className="service-card">
      <div className="p-5">
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
          {available === 1 && (
            <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-medium border border-secondary/20">
              Available
            </span>
          )}
        </div>
        
        <div className="mb-4 space-y-2 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary">{location}</span>
          </div>
          <div className="flex items-start">
            <Clock className="w-4 h-4 mr-2 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary">{operatingHours || 'Hours not specified'}</span>
          </div>
        </div>
        
        <a 
          href={`tel:${phone}`}
          className="gradient-bg block py-2.5 rounded-md font-medium text-center text-white transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-center">
            <Phone className="w-4 h-4 mr-2" />
            {phoneFormatted}
          </div>
        </a>
      </div>
    </div>
  );
};

export default ServiceCard;
