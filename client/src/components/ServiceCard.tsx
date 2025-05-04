import { Service } from "@shared/schema";

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

  return (
    <div className="service-card">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-text-secondary text-sm">{serviceType}</p>
          </div>
          {available === 1 && (
            <span className="bg-secondary/20 text-secondary px-2 py-1 rounded-full text-xs font-medium">
              Available
            </span>
          )}
        </div>
        
        <div className="mb-3">
          <div className="flex items-center text-text-secondary mb-1">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="text-sm">{location}</span>
          </div>
          <div className="flex items-center text-text-secondary">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm">{operatingHours || 'Hours not specified'}</span>
          </div>
        </div>
        
        <a 
          href={`tel:${phone}`}
          className="btn-primary block py-2 rounded-md font-medium text-center"
        >
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            Call Now: {phoneFormatted}
          </div>
        </a>
      </div>
    </div>
  );
};

export default ServiceCard;
