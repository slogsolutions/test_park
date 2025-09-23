// src/components/parking/ParkingSpaceList.tsx
import React from 'react';
import { ParkingSpace } from '../../types/parking';

interface ParkingListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
}

export default function ParkingSpaceList({ spaces, onSpaceSelect }: ParkingListProps) {
  if (!spaces || spaces.length === 0) {
    return <div className="p-4 text-center text-gray-500">No parking spaces found.</div>;
  }

  return (
    <div className="space-y-3 p-3 max-h-[calc(100vh-200px)] overflow-auto">
      {spaces.map((space) => {
        const address = space.address || {};
        const street = address.street || 'No street info';
        const city = address.city || 'No city info';

        // Ensure _id is a stable string for keys
        const key = typeof space._id === 'object' && (space._id as any).toString ? (space._id as any).toString() : (space._id ?? Math.random().toString());

        return (
          <div
            key={key}
            onClick={() => onSpaceSelect(space)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSpaceSelect(space); }}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail (if provided) */}
              <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  src={space.imageUrl || space.image || 'https://via.placeholder.com/160x120?text=Parking'}
                  alt={space.title || 'Parking image'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{space.title || 'Parking Space'}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {street}, {city}
                </p>

                {typeof space.rating === 'number' && space.rating > 0 && (
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="text-red-400 mr-1">★</span>
                    <span>{space.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right min-w-[80px]">
              <div className="text-sm font-semibold text-red-600">₹{space.pricePerHour ?? space.price ?? 0}/hr</div>
              <div className="text-xs text-gray-500 mt-1">
                {Array.isArray(space.amenities) ? space.amenities.length : 0} amenities
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
