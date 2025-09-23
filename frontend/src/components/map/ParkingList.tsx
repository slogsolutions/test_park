import React from 'react';
import { ParkingSpace } from '../../types/parking';

interface ParkingListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
}

export default function ParkingList({ spaces, onSpaceSelect }: ParkingListProps) {
  return (
    <div className="space-y-2">
      {spaces.map((space) => (
        <div
          key={space._id}
          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
          onClick={() => onSpaceSelect(space)}
        >
          <div>
            <h3 className="font-semibold">{space.title}</h3>
            <p className="text-sm text-gray-600">
              {space.address.street}, {space.address.city}
            </p>
            {space.rating > 0 && (
              <div className="flex items-center mt-1">
                <span className="text-red-400">★</span>
                <span className="text-sm text-gray-600 ml-1">
                  {space.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-blue-600 font-semibold">
              ${space.pricePerHour}/hr
            </div>
            <div className="text-xs text-gray-500">
              {space.amenities.length} amenities
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
