import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingScreen from '../../pages/LoadingScreen';

interface Location {
  _id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  pricePerHour: number;
  availability: any[];
  amenities: string[];
  rating: number;
  priceParking:number;
  availableSpots:number;
  status: string;
}

const ProviderLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading,setLoading] =useState(false)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/parking/my-spaces`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log("API Response:", response.data);

        const locations = response.data.map((item: any) => ({
          _id: item._id,
          title: item.title,
          latitude: item.location.coordinates[1],
          longitude: item.location.coordinates[0],
          address: `${item.address.street}, ${item.address.city}, ${item.address.state}, ${item.address.zipCode}, ${item.address.country}`,
          description: item.description,
          pricePerHour: item.pricePerHour,
          availability: item.availability,
          amenities: item.amenities,
          rating: item.rating,
          priceParking:item.priceParking,
          availableSpots:item.availableSpots,
          status: item.status,
        }));

        setLocations(locations);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setLocations([]);
      }finally{
        setLoading(false)
      }
    };

    fetchLocations();
  }, []);
  if (loading) {
    return  <div className="h-[calc(100vh-64px)] flex items-center justify-center">
    <LoadingScreen/>
   </div>
  }
  return (
    <div className="w-full p-6 mb-40 bg-gray-50">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">My Parking Spaces</h2>
      {locations.length === 0 ? (
        <p className="text-lg text-gray-500">No parking spaces available.</p>
      ) : (
        <ul className="space-y-6">
          {locations.map((location) => (
            <li key={location._id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">{location.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{location.address}</p>
                <p className="text-sm text-gray-600 mt-2">{location.description}</p>

                <div className="mt-4">
                <p className="text-lg font-medium text-gray-700">₹{location.priceParking} per 2 hour</p>
                </div>
                
                <div className="flex justify-between mt-4">
                  <p className="text-lg font-medium text-gray-700">₹{location.pricePerHour} Increse per hour</p>
                  <p className={`text-sm font-medium ${location.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`}>
                    Status: {location.status}
                  </p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Amenities:</h4>
                  <p className="text-sm text-gray-600">{location.amenities.join(', ')}</p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">Rating:</h4>
                  <p className="text-sm text-gray-600">{location.rating} / 5</p>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">availableSpots:</h4>
                  <p className="text-sm text-gray-600">{location.availableSpots}</p>
                </div>
                

                
      
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProviderLocations;
