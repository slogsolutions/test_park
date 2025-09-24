import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import { ParkingSpace } from '../../types/parking';
import { toast } from 'react-toastify';
import { FaStar, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ParkingPopupProps {
  space: ParkingSpace;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  user: { id?: string; _id?: string; name?: string; isVerified?: boolean } | null;
}

export default function ParkingPopup({ space, onClose, onMouseEnter, onMouseLeave, user }: ParkingPopupProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const address: any = space.address || {};
  const street = address.street || 'No street information';
  const city = address.city || 'No city information';
  
  // Create image array - use multiple images if available, otherwise use default images
  const images = Array.isArray(space.images) && space.images.length > 0 
    ? space.images 
    : space.imageUrl 
      ? [space.imageUrl] 
      : [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1600705725958-63dcbd505bd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
        ];

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (!user) {
      toast.info('Please log in to book the parking space.');
      return;
    }

    if (!user.isVerified) {
      toast.info('Your account is not verified. Please complete your verification to book the parking space.');
      return;
    }

    const sid = space._id && typeof space._id === 'object' && (space._id as any).toString 
      ? (space._id as any).toString() 
      : space._id;
    const uid = (user as any)._id ?? (user as any).id ?? (user as any).userId ?? null;

    navigate('/vehicle-details', { state: { spaceId: sid, userId: uid } });
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    const amenityIcons: { [key: string]: React.ElementType } = {
      security: FaShieldAlt,
      'cctv': FaVideo,
      'surveillance': FaVideo,
      'camera': FaVideo,
      charging: FaBolt,
      'electric': FaBolt,
      wheelchair: FaWheelchair,
      'accessible': FaWheelchair,
      'disability': FaWheelchair,
      covered: FaUmbrella,
      'roof': FaUmbrella,
      'indoor': FaUmbrella,
      '24/7': FaClock,
      '24hour': FaClock,
    };
    
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (amenityLower.includes(key)) {
        return icon;
      }
    }
    
    return FaCar;
  };

  const getAmenityDisplayName = (amenity: string) => {
    const nameMap: { [key: string]: string } = {
      'cctv': 'CCTV',
      'surveillance': 'Security Cameras',
      'charging': 'EV Charging',
      'electric': 'EV Charging',
      'wheelchair': 'Wheelchair Access',
      'accessible': 'Accessible',
      'covered': 'Covered Parking',
      '24/7': '24/7 Access',
      '24hour': '24/7 Access',
    };
    
    return nameMap[amenity.toLowerCase()] || amenity;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Popup
      latitude={space.location.coordinates[1]}
      longitude={space.location.coordinates[0]}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="top"
      offset={[0, -40]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ 
        maxWidth: '340px', 
        padding: '0',
        borderRadius: '12px'
      }}
      closeOnMove={false} // Important: Prevent closing when map moves
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] overflow-y-auto"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Image Carousel */}
        <div className="relative h-40 bg-gray-200 rounded-t-lg overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={space.title || 'Parking space'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Carousel Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200"
                aria-label="Previous image"
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200"
                aria-label="Next image"
              >
                <FaChevronRight className="text-sm" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Rating Badge */}
          {typeof space.rating === 'number' && space.rating > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-lg">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="text-sm font-semibold">{space.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Price */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-900 pr-2 leading-tight">
              {space.title || 'Parking Space'}
            </h3>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-blue-600">₹{space.pricePerHour ?? space.price ?? 0}</div>
              <div className="text-xs text-gray-500">per hour</div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center text-gray-600 mb-3">
            <FaMapMarkerAlt className="text-red-500 mr-2 flex-shrink-0" />
            <span className="text-sm truncate">{street}, {city}</span>
          </div>

          {/* Description */}
          {space.description && (
            <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
              {space.description}
            </p>
          )}

          {/* Amenities */}
          {space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {space.amenities.slice(0, 4).map((amenity, index) => {
                  const AmenityIcon = getAmenityIcon(amenity);
                  const displayName = getAmenityDisplayName(amenity);
                  return (
                    <div
                      key={index}
                      className="flex items-center px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100"
                      title={displayName}
                    >
                      <AmenityIcon className="mr-1 text-xs" />
                      {displayName.length > 12 ? displayName.substring(0, 10) + '...' : displayName}
                    </div>
                  );
                })}
                {space.amenities.length > 4 && (
                  <div 
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 border border-gray-200"
                    title={`${space.amenities.slice(4).join(', ')}`}
                  >
                    +{space.amenities.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Book Now Button */}
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl active:scale-95 mb-2"
          >
            Book Now
          </button>

          {/* Additional Info */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              <FaClock className="mr-1" />
              <span>Available 24/7</span>
            </div>
            <span>•</span>
            <span>Instant booking</span>
          </div>
        </div>
      </div>
    </Popup>
  );
}