import React from 'react';
import { Marker } from 'react-map-gl';
import { FaMapMarkerAlt } from 'react-icons/fa'; // Default icon for markers

interface ParkingMarkerProps {
  latitude: number;
  longitude: number;
  color?: string;
  isCurrentLocation?: boolean;
  icon?: React.ElementType; // Accepts a React component for the icon
  onClick?: () => void;
}

export default function ParkingMarker({
  latitude,
  longitude,
  color = 'green',
  isCurrentLocation = false,
  icon: CustomIcon = FaMapMarkerAlt, // Default to FaMapMarkerAlt if no icon is provided
  onClick,
}: ParkingMarkerProps) {
  return (
    <Marker latitude={latitude} longitude={longitude} onClick={onClick}>
      <div
        className={`cursor-pointer`}
        style={{
          fontSize: isCurrentLocation ? '24px' : '20px',
          color,
        }}
      >
        <CustomIcon />
      </div>
    </Marker>
  );
}
