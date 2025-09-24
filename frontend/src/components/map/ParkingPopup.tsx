import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import { ParkingSpace } from '../../types/parking';
import { toast } from 'react-toastify';
import { FaStar, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella, FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';

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
  const price = space.pricePerHour ?? space.price ?? 0;
  const rating = space.rating ?? 0;
  const amenities = space.amenities || [];
  
  // Create image array
  const images = Array.isArray(space.images) && space.images.length > 0 
    ? space.images 
    : space.imageUrl 
      ? [space.imageUrl] 
      : [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
        ];

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.info('Please log in to book the parking space.');
      return;
    }

    if (!user.isVerified) {
      toast.info('Your account is not verified. Please complete your verification to book.');
      return;
    }

    const sid = space._id?.toString() || space._id;
    const uid = user._id || user.id;
    navigate('/vehicle-details', { state: { spaceId: sid, userId: uid } });
  };

  const amenityIcons: { [key: string]: React.ElementType } = {
    security: FaShieldAlt,
    cctv: FaVideo,
    charging: FaBolt,
    wheelchair: FaWheelchair,
    covered: FaUmbrella,
    '24/7': FaClock,
    surveillance: FaVideo,
    electric: FaBolt,
    accessible: FaWheelchair,
    disability: FaWheelchair,
    roof: FaUmbrella,
    indoor: FaUmbrella,
    '24hour': FaClock,
  };

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase();
    return amenityIcons[key] || FaCar;
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
      offset={[0, -20]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ 
        maxWidth: '320px',
        padding: '0',
        borderRadius: '12px'
      }}
      closeOnMove={false}
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Image Section */}
        <div className="relative h-28 bg-gradient-to-br from-blue-400 to-blue-600">
          <img
            src={images[currentImageIndex]}
            alt={space.title || 'Parking space'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Carousel Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200 shadow-lg"
                aria-label="Previous image"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200 shadow-lg"
                aria-label="Next image"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </>
          )}
          
          {/* Rating Badge */}
          {rating > 0 && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-lg">
              <FaStar className="text-yellow-400 mr-1 text-xs" />
              <span className="text-xs font-bold">{rating.toFixed(1)}</span>
            </div>
          )}

          {/* Price Tag */}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full shadow-lg">
            <span className="font-bold">₹{price}</span>
            <span className="text-xs ml-0.5">/hour</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">
            {space.title || 'Premium Parking Space'}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-2">
            <FaMapMarkerAlt className="text-red-500 mr-1 text-xs flex-shrink-0" />
            <span className="text-xs">{street}, {city}</span>
          </div>

          {/* Description */}
          {space.description && (
            <p className="text-gray-700 text-xs mb-2 leading-relaxed line-clamp-2">
              {space.description}
            </p>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {amenities.slice(0, 3).map((amenity, index) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 rounded text-xs font-medium text-blue-800 border border-blue-200"
                    >
                      <Icon className="mr-0.5 text-xs" />
                      {amenity.length > 10 ? amenity.substring(0, 8) + '...' : amenity}
                    </span>
                  );
                })}
                {amenities.length > 3 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                    +{amenities.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Book Button */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-3 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          >
            <FaCheck className="mr-1 text-xs" />
            Book Now - ₹{price}/hour
          </button>
        </div>
      </div>
    </Popup>
  );
}