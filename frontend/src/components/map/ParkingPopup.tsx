// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Popup } from 'react-map-gl';
// import { ParkingSpace } from '../../types/parking';
// import { toast } from 'react-toastify';

// interface ParkingPopupProps {
//   space: ParkingSpace;
//   onClose: () => void;
//   user: { id?: string; _id?: string; name?: string; isVerified?: boolean } | null;
// }

// export default function ParkingPopup({ space, onClose, user }: ParkingPopupProps) {
//   const navigate = useNavigate();
//   // Safely access address properties
//   const address: any = space.address || {};
//   const street = address.street || 'No street information';
//   const city = address.city || 'No city information';

//   const handleBookNow = () => {
//     if (!user) {
//       toast.info('Please log in to book the parking space.');
//       return;
//     }

//     if (!user.isVerified) {
//       toast.info('Your account is not verified. Please complete your verification to book the parking space.');
//       return;
//     }

//     // Ensure we pass string ids (handle mongoose ObjectId or plain id)
//     const sid = space._id && typeof space._id === 'object' && (space._id as any).toString ? (space._id as any).toString() : space._id;
//     const uid = (user as any)._id ?? (user as any).id ?? (user as any).userId ?? null;

//     navigate('/vehicle-details', { state: { spaceId: sid, userId: uid } });
//   };

//   return (
//     <Popup
//       latitude={space.location.coordinates[1]}
//       longitude={space.location.coordinates[0]}
//       onClose={onClose}
//       closeButton={false}
//       closeOnClick={false}
//       className="max-w-[90%] md:max-w-sm p-0 rounded-lg shadow-lg bg-white"
//       anchor="top"
//       offset={[0, -12]}
//     >
//       <div className="p-4 relative">
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 p-1 rounded-full transition"
//           aria-label="Close"
//         >
//           ✕
//         </button>

//         {/* Title */}
//         <h3 className="font-bold text-lg text-gray-800">{space.title || 'Parking Space'}</h3>

//         {/* Description */}
//         {space.description && <p className="text-gray-600 mt-1 text-sm">{space.description}</p>}

//         {/* Price */}
//         <p className="text-blue-600 font-semibold mt-2 text-lg">
//           ₹{space.pricePerHour ?? space.price ?? 0}/hour
//         </p>

//         {/* Address */}
//         <p className="text-sm text-gray-500 mt-1">
//           {street}, {city}
//         </p>

//         {/* Amenities */}
//         {space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0 && (
//           <div className="mt-3">
//             <h4 className="text-sm font-semibold text-gray-700">Amenities:</h4>
//             <div className="flex flex-wrap gap-2 mt-2">
//               {space.amenities.map((amenity) => (
//                 <span
//                   key={amenity}
//                   className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full shadow-sm"
//                 >
//                   {amenity}
//                 </span>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Book Now Button */}
//         <button
//           onClick={handleBookNow}
//           className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
//         >
//           Book Now
//         </button>
//       </div>
//     </Popup>
//   );
// }


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import { ParkingSpace } from '../../types/parking';
import { toast } from 'react-toastify';
import { FaStar, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella } from 'react-icons/fa';

interface ParkingPopupProps {
  space: ParkingSpace;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  user: { id?: string; _id?: string; name?: string; isVerified?: boolean } | null;
}

export default function ParkingPopup({ space, onClose, onMouseEnter, onMouseLeave, user }: ParkingPopupProps) {
  const navigate = useNavigate();
  const address: any = space.address || {};
  const street = address.street || 'No street information';
  const city = address.city || 'No city information';

  const handleBookNow = () => {
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
    
    // Find matching icon or use default
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (amenityLower.includes(key)) {
        return icon;
      }
    }
    
    return FaCar; // Default icon
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

  return (
    <Popup
      latitude={space.location.coordinates[1]}
      longitude={space.location.coordinates[0]}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      className="custom-popup max-w-[320px] p-0 rounded-xl shadow-2xl border border-gray-200"
      anchor="top"
      offset={[0, -40]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative">
        {/* Header Image */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative rounded-t-xl overflow-hidden">
          <img
            src={space.imageUrl || space.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}
            alt={space.title || 'Parking space'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Rating Badge */}
          {typeof space.rating === 'number' && space.rating > 0 && (
            <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-full flex items-center">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="text-sm font-semibold">{space.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Price */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900 pr-2">{space.title || 'Parking Space'}</h3>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold text-blue-600">₹{space.pricePerHour ?? space.price ?? 0}</div>
              <div className="text-xs text-gray-500">per hour</div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center text-gray-600 mb-3">
            <FaMapMarkerAlt className="text-red-500 mr-2" />
            <span className="text-sm">{street}, {city}</span>
          </div>

          {/* Description */}
          {space.description && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{space.description}</p>
          )}

          {/* Amenities */}
          {space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {space.amenities.slice(0, 4).map((amenity) => {
                  const AmenityIcon = getAmenityIcon(amenity);
                  const displayName = getAmenityDisplayName(amenity);
                  return (
                    <div
                      key={amenity}
                      className="flex items-center px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700"
                      title={displayName}
                    >
                      <AmenityIcon className="mr-1 text-xs" />
                      {displayName.length > 12 ? displayName.substring(0, 10) + '...' : displayName}
                    </div>
                  );
                })}
                {space.amenities.length > 4 && (
                  <div 
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Book Now
          </button>

          {/* Additional Info */}
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <div className="flex items-center">
              <FaClock className="mr-1" />
              <span>Available 24/7</span>
            </div>
            <span>•</span>
            <span>Instant booking</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-popup :global(.mapboxgl-popup-content) {
          padding: 0;
          border-radius: 12px;
        }
        
        .custom-popup :global(.mapboxgl-popup-close-button) {
          position: absolute;
          right: 8px;
          top: 8px;
          background: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Popup>
  );
}
