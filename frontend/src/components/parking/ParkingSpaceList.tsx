// import React from 'react';
// import { ParkingSpace } from '../../types/parking';

// interface ParkingSpaceListProps {
//   spaces: ParkingSpace[];
//   onSpaceSelect: (space: ParkingSpace) => void;
//   searchRadius: number;
//   onRadiusChange: (radius: number) => void;
//   userLocation: { lat: number; lng: number }; // User location added
//   filters: {
//     amenities: { [key: string]: boolean };
//     priceRange: [number, number];
//   };
// }

// // Haversine formula to calculate distance
// const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//   const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
//   const R = 6371; // Earth's radius in kilometers
//   const dLat = toRadians(lat2 - lat1);
//   const dLon = toRadians(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c; // Distance in kilometers
// };

// export default function ParkingSpaceList({
//   spaces,
//   onSpaceSelect,
//   searchRadius,
//   onRadiusChange,
//   userLocation,
// }: ParkingSpaceListProps) {
//   return (
//     <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto">
//       {/* Search Radius Slider */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Search Radius: {searchRadius / 1000} km
//         </label>
//         <input
//           type="range"
//           min="1000"
//           max="20000"
//           step="1000"
//           value={searchRadius}
//           onChange={(e) => onRadiusChange(Number(e.target.value))}
//           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-red-500"
//         />
//       </div>

//       {/* Parking Spaces List */}
//       <div className="space-y-2">
//         {spaces.length === 0 ? (
//           <p className="text-gray-500 text-center">No parking spaces found in this area.</p>
//         ) : (
//           spaces.map((space: any) => {
//             // Calculate the distance using the Haversine formula
//             const distance = calculateDistance(
//               userLocation.lat,
//               userLocation.lng,
//               space.location.coordinates[1], // Latitude of parking space
//               space.location.coordinates[0]  // Longitude of parking space
//             );

//             // Check if the space is within the search radius
//             const isWithinRadius = distance <= searchRadius / 1000;

//             if (!isWithinRadius) return null; // If it's outside the search radius, skip this space

//             return (
//               <div
//                 key={space._id}
//                 onClick={() => onSpaceSelect(space)}
//                 className="flex justify-between items-center p-3 hover:bg-red-50 rounded-lg cursor-pointer border border-gray-100 shadow-sm"
//               >
//                 {/* Parking Space Details */}
//                 <div>
//                   <h3 className="font-semibold text-gray-900">{space.title || 'Unnamed Parking Space'}</h3>
//                   <p className="text-sm text-gray-600">
//                     {space.address?.street || 'Unknown Street'}, {space.address?.city || 'Unknown City'}
//                   </p>
//                 </div>

//                 {/* Pricing, Amenities, and Distance */}
//                 <div className="text-right">
//                   <p className="text-red-600 font-semibold">
//                     ₹{space.pricePerHour || 0}/hr
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {space.amenities?.length || 0} amenities
//                   </p>
//                   {distance && (
//                     <p className="text-xs text-gray-500">~{distance.toFixed(1)} km away</p>
//                   )}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }


import React from 'react';
import { ParkingSpace } from '../../types/parking';

interface ParkingSpaceListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  userLocation: { lat: number; lng: number }; // User location added
  filters: {
    amenities: { [key: string]: boolean };
    priceRange: [number, number];
  };
}

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export default function ParkingSpaceList({
  spaces,
  onSpaceSelect,
  searchRadius,
  onRadiusChange,
  userLocation,
  filters,
}: ParkingSpaceListProps) {
  const filteredSpaces = spaces.filter((space: any) => {
    // Calculate distance
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      space.location.coordinates[1], // Latitude
      space.location.coordinates[0]  // Longitude
    );

    // Check if within search radius
    if (distance > searchRadius / 1000) return false;

    // Check amenities
    for (const [key, value] of Object.entries(filters.amenities)) {
      if (value && !space.amenities?.includes(key)) {
        return false; // If a selected amenity is not in the space's amenities, exclude it
      }
    }

    // Check price range
    if (
      space.pricePerHour < filters.priceRange[0] ||
      space.pricePerHour > filters.priceRange[1]
    ) {
      return false;
    }

    // Check if there are available slots
//     const hasAvailableSlots = space.availability?.some((day: any) =>
//       day.slots.some((slot: any) => !slot.isBooked)
//     );

//     console.log("All Parking Spaces:", spaces);
// console.log("User Location:", userLocation);

//     if (!hasAvailableSlots) return false; // Exclude fully booked spaces

    // Add distance property to the space
    space.distance = distance; // Attach distance to the space object
    return true;
  });

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto">
      {/* Search Radius Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Radius: {searchRadius / 1000} km
        </label>
        <input
          type="range"
          min="1000"
          max="20000"
          step="1000"
          value={searchRadius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Parking Spaces List */}
      <div className="space-y-2">
        {filteredSpaces.length === 0 ? (
          <p className="text-gray-500 text-center">No parking spaces match your filters.</p>
        ) : (
          filteredSpaces.map((space: any) => (
            <div
              key={space._id}
              onClick={() => onSpaceSelect(space)}
              className="flex justify-between items-center p-3 hover:bg-red-50 rounded-lg cursor-pointer border border-gray-100 shadow-sm"
            >
              {/* Parking Space Details */}
              <div>
                <h3 className="font-semibold text-gray-900">{space.title || 'Unnamed Parking Space'}</h3>
                <p className="text-sm text-gray-600">
                  {space.address?.street || 'Unknown Street'}, {space.address?.city || 'Unknown City'}
                </p>
              </div>

              {/* Pricing, Amenities, and Distance */}
              <div className="text-right">
                <p className="text-red-600 font-semibold">
                  ₹{space.pricePerHour || 0}/hr
                </p>
                <p className="text-xs text-gray-500">
                  {space.amenities?.length || 0} amenities
                </p>
                {space.distance && (
                  <p className="text-xs text-gray-500">~{space.distance.toFixed(1)} km away</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
