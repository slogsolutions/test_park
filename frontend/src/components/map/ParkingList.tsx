// src/components/parking/ParkingSpaceList.tsx
import React from 'react';
import { ParkingSpace } from '../../types/parking';
import { FaStar, FaMapMarkerAlt, FaClock, FaShield, FaBolt, FaWheelchair, FaVideo, FaUmbrella, FaCar } from 'react-icons/fa';

interface ParkingListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
}

export default function ParkingSpaceList({ spaces, onSpaceSelect }: ParkingListProps) {
  if (!spaces || spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <FaCar className="text-2xl text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No parking spaces found</h3>
        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
      </div>
    );
  }

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const amenityIcons: { [key: string]: React.ElementType } = {
      security: FaShield,
      'cctv': FaVideo,
      'surveillance': FaVideo,
      'camera': FaVideo,
      charging: FaBolt,
      'electric': FaBolt,
      wheelchair: FaWheelchair,
      'accessible': FaWheelchair,
      covered: FaUmbrella,
      'roof': FaUmbrella,
      'indoor': FaUmbrella,
      '24/7': FaClock,
    };
    
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (amenityLower.includes(key)) {
        return icon;
      }
    }
    
    return FaCar;
  };

  return (
    <div className="space-y-3 p-4 max-h-[calc(100vh-140px)] overflow-auto">
      {spaces.map((space, index) => {
        const address = space.address || {};
        const street = address.street || 'No street info';
        const city = address.city || 'No city info';
        const amenities = Array.isArray(space.amenities) ? space.amenities : [];
        const price = space.pricePerHour ?? space.price ?? 0;
        const rating = typeof space.rating === 'number' ? space.rating : 0;

        const key = typeof space._id === 'object' && (space._id as any).toString 
          ? (space._id as any).toString() 
          : (space._id ?? `space-${index}`);

        return (
          <div
            key={key}
            onClick={() => onSpaceSelect(space)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' || e.key === ' ') onSpaceSelect(space); 
            }}
            className="group bg-white rounded-xl shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 overflow-hidden"
          >
            {/* Image Section */}
            <div className="relative h-32 bg-gradient-to-br from-blue-50 to-gray-100 overflow-hidden">
              <img
                src={space.imageUrl || space.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
                alt={space.title || 'Parking space'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-5 transition-all duration-300"></div>
              
              {/* Price Badge */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                <span className="font-bold text-lg text-blue-600">₹{price}</span>
                <span className="text-xs text-gray-500 ml-1">/hr</span>
              </div>

              {/* Rating Badge */}
              {rating > 0 && (
                <div className="absolute top-3 left-3 bg-black/80 text-white px-2 py-1 rounded-full flex items-center text-xs">
                  <FaStar className="text-yellow-400 mr-1" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Title and Location */}
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-1">
                  {space.title || 'Premium Parking Space'}
                </h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <FaMapMarkerAlt className="text-red-500 mr-2 flex-shrink-0" />
                  <span className="truncate">{street}, {city}</span>
                </div>
              </div>

              {/* Description */}
              {space.description && (
                <p className="text-gray-700 text-sm mb-3 line-clamp-2 leading-relaxed">
                  {space.description}
                </p>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {amenities.slice(0, 3).map((amenity, idx) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                          title={amenity}
                        >
                          <AmenityIcon className="mr-1 text-xs" />
                          {amenity.length > 12 ? amenity.substring(0, 10) + '...' : amenity}
                        </span>
                      );
                    })}
                    {amenities.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="flex items-center mr-3">
                    <FaClock className="mr-1" />
                    {space.available24_7 ? '24/7' : 'Limited hours'}
                  </span>
                  <span>{amenities.length} amenit{amenities.length === 1 ? 'y' : 'ies'}</span>
                </div>
                
                <div className="text-right">
                  <button 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpaceSelect(space);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
          </div>
        );
      })}
    </div>
  );
}