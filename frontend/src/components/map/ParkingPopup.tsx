import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import { ParkingSpace } from '../../types/parking';
import { toast } from 'react-toastify';


interface ParkingPopupProps {
  space: ParkingSpace;
  onClose: () => void;
  user: { id: string; name: string; isVerified: boolean } | null; // Make user nullable and add `isVerified`
}

export default function ParkingPopup({ space, onClose, user }: ParkingPopupProps) {
  const navigate = useNavigate();
  console.log('Parking Space:', space);
  console.log('user:', user);

  // Safely access address properties
  const address = space.address || {};
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

    navigate('/vehicle-details', { state: { spaceId: space._id, userId: user.id } });
  };

  return (
    <Popup
      latitude={space.location.coordinates[1]}
      longitude={space.location.coordinates[0]}
      onClose={onClose}
      closeButton={false}
      closeOnClick={false}
      className="max-w-[90%] md:max-w-sm p-0 rounded-lg shadow-lg bg-white"
    >
      <div className="p-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 p-1 rounded-full transition"
        >
          ✕
        </button>

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-800">{space.title}</h3>

        {/* Description */}
        <p className="text-gray-600 mt-1 text-sm">{space.description}</p>

        {/* Price */}
        <p className="text-blue-600 font-semibold mt-2 text-lg">
          ₹{space.pricePerHour}/hour
        </p>

        {/* Address */}
        <p className="text-sm text-gray-500 mt-1">
          {street}, {city}
        </p>

        {/* Amenities */}
        {space.amenities && space.amenities.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-700">Amenities:</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {space.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full shadow-sm"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Book Now Button */}
        <button
          onClick={handleBookNow}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Book Now
        </button>
      </div>
    </Popup>
  );
}
