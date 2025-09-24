// import React from 'react';
// import { Marker } from 'react-map-gl';
// import { FaMapMarkerAlt } from 'react-icons/fa';
// import { ParkingSpace } from '../../types/parking';

// interface ParkingMarkerProps {
//   latitude: number;
//   longitude: number;
//   color?: string;
//   isCurrentLocation?: boolean;
//   icon?: React.ElementType; // Accepts a React component for the icon
//   onClick?: (e?: React.MouseEvent) => void;
//   onMouseEnter?: (e?: React.MouseEvent) => void;
//   onMouseLeave?: (e?: React.MouseEvent) => void;
//   space?: ParkingSpace | null;
// }

// export default function ParkingMarker({
//   latitude,
//   longitude,
//   color = 'green',
//   isCurrentLocation = false,
//   icon: CustomIcon = FaMapMarkerAlt,
//   onClick,
//   onMouseEnter,
//   onMouseLeave,
// }: ParkingMarkerProps) {
//   return (
//     <Marker latitude={latitude} longitude={longitude} anchor="bottom">
//       <div
//         onClick={(e) => {
//           e.stopPropagation();
//           onClick && onClick(e);
//         }}
//         onMouseEnter={(e) => {
//           // Stop propagation so map interactions don't get weird
//           e.stopPropagation();
//           onMouseEnter && onMouseEnter(e);
//         }}
//         onMouseLeave={(e) => {
//           e.stopPropagation();
//           onMouseLeave && onMouseLeave(e);
//         }}
//         onFocus={(e) => {
//           // keyboard accessibility: treat focus like hover
//           e.stopPropagation();
//           onMouseEnter && onMouseEnter((e as unknown) as React.MouseEvent);
//         }}
//         onBlur={(e) => {
//           e.stopPropagation();
//           onMouseLeave && onMouseLeave((e as unknown) as React.MouseEvent);
//         }}
//         className={`cursor-pointer transform transition-transform hover:scale-110`}
//         style={{
//           fontSize: isCurrentLocation ? '26px' : '22px',
//           color,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//         role="button"
//         aria-label="Parking marker"
//         tabIndex={0}
//       >
//         <CustomIcon />
//       </div>
//     </Marker>
//   );
// }



import React from 'react';
import { Marker } from 'react-map-gl';
import { FaMapMarkerAlt, FaParking, FaUserCircle, FaStar, FaClock } from 'react-icons/fa';
import { ParkingSpace } from '../../types/parking';

interface ParkingMarkerProps {
  latitude: number;
  longitude: number;
  color?: string;
  isCurrentLocation?: boolean;
  icon?: React.ElementType;
  onClick?: (e?: React.MouseEvent) => void;
  onMouseEnter?: (e?: React.MouseEvent) => void;
  onMouseLeave?: (e?: React.MouseEvent) => void;
  space?: ParkingSpace | null;
}

export default function ParkingMarker({
  latitude,
  longitude,
  color = '#10b981',
  isCurrentLocation = false,
  icon: CustomIcon = FaParking,
  onClick,
  onMouseEnter,
  onMouseLeave,
  space,
}: ParkingMarkerProps) {
  const price = space?.pricePerHour ?? space?.price ?? 0;
  const rating = space?.rating ?? 0;
  const hasDiscount = space?.discountPercentage && space.discountPercentage > 0;

  return (
    <Marker 
      latitude={latitude} 
      longitude={longitude} 
      anchor="bottom"
      pitchAlignment="viewport"
    >
      {/* Main Marker Container */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(e);
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onMouseEnter && onMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          onMouseLeave && onMouseLeave(e);
        }}
        onFocus={(e) => {
          e.stopPropagation();
          onMouseEnter && onMouseEnter((e as unknown) as React.MouseEvent);
        }}
        onBlur={(e) => {
          e.stopPropagation();
          onMouseLeave && onMouseLeave((e as unknown) as React.MouseEvent);
        }}
        className="group cursor-pointer transform transition-all duration-300 ease-out"
        role="button"
        aria-label={isCurrentLocation ? "Your current location" : `Parking space - ₹${price}/hour`}
        tabIndex={0}
      >
        {/* Current Location Marker */}
        {isCurrentLocation ? (
          <div className="relative">
            {/* Pulsing Animation Effect */}
            <div className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Main Marker */}
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-full shadow-2xl border-4 border-white transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <FaUserCircle className="text-2xl" />
            </div>
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
          </div>
        ) : (
          /* Parking Space Marker */
          <div className="relative">
            {/* Price Badge - Appears on hover */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 delay-100 z-20">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                <div className="flex items-center gap-1 text-sm font-bold">
                  <span>₹{price}</span>
                  <span className="text-xs font-normal">/hr</span>
                </div>
                {hasDiscount && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full border border-white">
                    -{space!.discountPercentage}%
                  </div>
                )}
              </div>
              {/* Arrow pointing to marker */}
              <div className="w-2 h-2 bg-emerald-600 rotate-45 mx-auto -mt-1"></div>
            </div>

            {/* Rating Badge */}
            {rating > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-lg border-2 border-white font-bold z-10 flex items-center gap-1">
                <FaStar className="text-xs" />
                {rating.toFixed(1)}
              </div>
            )}

            {/* Available Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg z-10 group-hover:scale-125 transition-transform duration-300">
              <div className="w-full h-full bg-green-300 rounded-full animate-pulse"></div>
            </div>

            {/* Main Marker Body */}
            <div className={`
              relative bg-gradient-to-br from-white to-gray-50 p-3 rounded-2xl shadow-2xl border-4 transform transition-all duration-300
              group-hover:scale-110 group-hover:-translate-y-2
              ${hasDiscount ? 'border-orange-400' : 'border-green-400'}
            `}>
              {/* Discount Ribbon */}
              {hasDiscount && (
                <div className="absolute -top-3 -left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full rotate-[-25deg] shadow-lg font-bold z-10">
                  SALE
                </div>
              )}

              {/* Icon Container */}
              <div className={`
                relative text-2xl transition-colors duration-300
                ${hasDiscount ? 'text-orange-500' : 'text-green-500'}
                group-hover:text-green-600
              `}>
                <CustomIcon />
              </div>

              {/* Inner Glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-white/50"></div>
            </div>

            {/* Outer Glow Effect */}
            <div className="absolute inset-0 bg-green-400/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-2xl"></div>

            {/* Pulse Animation for Available Spaces */}
            {space?.availableSpaces && space.availableSpaces > 0 && (
              <div className="absolute inset-0 border-4 border-green-200 rounded-2xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </div>
        )}

        {/* Hover Information Panel (Optional) */}
        {space && !isCurrentLocation && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200 pointer-events-none z-30 min-w-[120px]">
            <div className="bg-black/90 text-white text-xs rounded-lg p-2 shadow-2xl backdrop-blur-sm border border-white/20">
              <div className="font-semibold truncate mb-1">{space.title || 'Parking Space'}</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-green-300 font-bold">₹{price}</span>
                {space.available24_7 && (
                  <FaClock className="text-blue-300 text-xs" title="24/7 Available" />
                )}
              </div>
            </div>
            {/* Arrow */}
            <div className="w-3 h-3 bg-black/90 rotate-45 mx-auto -mt-1"></div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .group:hover .floating {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </Marker>
  );
}