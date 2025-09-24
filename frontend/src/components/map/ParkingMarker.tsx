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
import { FaMapMarkerAlt } from 'react-icons/fa';
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
  icon: CustomIcon = FaMapMarkerAlt,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ParkingMarkerProps) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="bottom">
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
        className="cursor-pointer transform transition-all duration-200 hover:scale-125 hover:z-50"
        style={{
          fontSize: isCurrentLocation ? '32px' : '28px',
          color: isCurrentLocation ? '#3b82f6' : color,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
        role="button"
        aria-label={isCurrentLocation ? "Your location" : "Parking space"}
        tabIndex={0}
      >
        <div className="relative">
          <CustomIcon />
          {!isCurrentLocation && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-green-500"></div>
          )}
        </div>
      </div>
    </Marker>
  );
}