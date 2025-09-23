import React, { useEffect, useState } from 'react';
import { X, Car, Dumbbell, Waves, Dog, Home, ShieldCheck, Plug, Video } from 'lucide-react';
import LocationSearchBox from '../components/search/LocationSearch';
import { GeocodingResult } from '../utils/geocoding';
import { useMapContext } from '../context/MapContext';
import { parkingService } from '../services/parking.service';
import { ParkingSpace } from '../types/parking';
import { toast } from 'react-toastify';
import ParkingSpaceList from '../components/parking/ParkingSpaceList';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { addDays } from 'date-fns';
import FilterBox from './Filterbox';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { viewport, setViewport } = useMapContext();
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000);
    const { user } = useAuth();
  
  const navigate=useNavigate()
  
  const [filters, setFilters] = useState({
    amenities: {
      covered: false,
      security: false,
      charging: false,
      cctv: false,
      wheelchair: false,
    },
    priceRange: [0, 500], // Default price range
  });
  
  const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
    try {
      const spaces = await parkingService.getNearbySpaces(lat, lng, searchRadius);
      setParkingSpaces(spaces);
    } catch (error) {
      toast.error('Failed to fetch parking spaces.');
    }
  };
    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setViewport({ ...viewport, latitude, longitude });
            setCurrentLocation({ lat: latitude, lng: longitude });
            fetchNearbyParkingSpaces(latitude, longitude);
       
          },
          (error) => {
            console.error('Location error:', error);
            toast.error('Could not get your location. Please enable location services.');
          
          }
        );
      }
    }, []);

  if (!isOpen) return null;

  // Amenities Section
  const amenities = [
    { id: 'covered', label: 'Covered Parking', icon: Car },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'charging', label: 'EV Charging', icon: Plug },
    { id: 'cctv', label: 'CCTV Surveillance', icon: Video },
    { id: 'wheelchair', label: 'Wheelchair Accessible', icon: Home },
  ];
  // useEffect(() => {
  //   if (searchedLocation) {
  //     console.log("Updated searched location:", searchedLocation);
  //     fetchNearbyParkingSpaces(searchedLocation.lat, searchedLocation.lng);
  //   }
  // }, [searchedLocation]); // Run effect when searchedLocation changes

  const handleLocationSelect = async (result: GeocodingResult) => {
    setSearchedLocation({ lat: result.latitude, lng: result.longitude });
    setViewport({ ...viewport, longitude: result.longitude, latitude: result.latitude });

    try {
      const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, searchRadius);
      console.log(spaces);
      
      setParkingSpaces(spaces);
      if (spaces.length === 0) {
        toast.info('No nearby parking spaces available at the selected location.');
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces for the selected location.');
    }
  };


const handleGoToCurrentLocation = () => {
  console.log("hanlding current sistuatuon");
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
  console.log("hanlding current sistuatuon",latitude,longitude);

  setCurrentLocation({ lat: latitude, lng: longitude });
  setSearchedLocation({ lat: latitude, lng: longitude }); 
      setViewport({
        ...viewport,
        latitude,
        longitude,
        zoom: 14,
      });
    },
    () => {
      toast.error('Failed to access your current location.');
    }
  );
};


  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto flex justify-center ">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 md:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex  gap-2">
            <Home className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800">Find Your Parking Space</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Location Search */}
        <div className="relative mb-6 z-10">
          <LocationSearchBox onLocationSelect={handleLocationSelect} onGoToCurrentLocation={handleGoToCurrentLocation} />
        </div>

        {/* Filters */}
        <FilterBox filters={filters} onFilterChange={setFilters} />

        {/* Amenities Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Amenities:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {amenities.map((amenity:any) => (
              <div 
                key={amenity.id} 
                className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer hover:bg-red-100 transition ${
                  filters.amenities[amenity.id] ? 'bg-red-200 border-red-400' : 'border-gray-300'
                }`}
                onClick={() => setFilters({
                  ...filters,
                  amenities: { ...filters.amenities, [amenity.id]: !filters.amenities[amenity.id] }
                })}
              >
                <amenity.icon className="w-8 h-8 text-red-500" />
                <p className="text-sm text-gray-700 mt-2">{amenity.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parking Space List */}
        <ParkingSpaceList
          spaces={parkingSpaces}
            // onClick={() => handleMarkerClick(space)}
          searchRadius={searchRadius}
          onRadiusChange={setSearchRadius}
          onSpaceSelect={(space) => {
            navigate('/parking-details', { state: { space ,user} });
          }}
          filters={filters}
          userLocation={searchedLocation || currentLocation}
        />

      </div>
    </div>
  );
}


// import React, { useEffect, useState } from 'react';
// import { X, Home } from 'lucide-react';
// import LocationSearchBox from '../components/search/LocationSearch';
// import { useMapContext } from '../context/MapContext';
// import { toast } from 'react-toastify';
// import DatePicker from 'react-datepicker';
// import "react-datepicker/dist/react-datepicker.css";
// import { addDays } from 'date-fns';
// import FilterBox from './Filterbox';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { io } from 'socket.io-client';

// const socket = io('http://localhost:5000'); // Replace with your backend URL

// interface SearchOverlayProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
//   const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const { viewport, setViewport } = useMapContext();
//   const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [providerDetails, setProviderDetails] = useState<any | null>(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           setViewport({ ...viewport, latitude, longitude });
//           setCurrentLocation({ lat: latitude, lng: longitude });
//         },
//         (error) => {
//           console.error('Location error:', error);
//           toast.error('Could not get your location. Please enable location services.');
//         }
//       );
//     }
//   }, []);

//   // Handle provider response from the backend
//   useEffect(() => {
//     socket.on('provider-accepted', (data) => {
//       setLoading(false);
//       setProviderDetails(data);
//     });

//     return () => {
//       socket.off('provider-accepted');
//     };
//   }, []);

//   const handleLocationSelect = async (result: any) => {
//     setSearchedLocation({ lat: result.latitude, lng: result.longitude });
//     setViewport({ ...viewport, longitude: result.longitude, latitude: result.latitude });

//     // Send request to all providers via socket
//     setLoading(true);
//     setProviderDetails(null);
//     socket.emit('request-parking', {
//       lat: result.latitude,
//       lng: result.longitude,
//       userId: user?.id,
//     });
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-white z-50 overflow-y-auto flex justify-center">
//       <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6 md:p-8">
        
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div className="flex gap-2">
//             <Home className="w-6 h-6 text-red-500" />
//             <h2 className="text-2xl font-bold text-gray-800">Find Your Parking Space</h2>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
//             <X className="w-5 h-5 text-gray-700" />
//           </button>
//         </div>

//         {/* Location Search */}
//         <div className="relative mb-6 z-10">
//           <LocationSearchBox onLocationSelect={handleLocationSelect} />
//         </div>

//         {/* Loading State */}
//         {loading && (
//           <div className="flex justify-center items-center">
//             <p className="text-lg font-semibold">Searching for a parking provider...</p>
//           </div>
//         )}

//         {/* Provider Details */}
//         {providerDetails && (
//           <div className="mt-6 p-4 border rounded-lg shadow-lg">
//             <h3 className="text-lg font-bold">{providerDetails.name}</h3>
//             <p><strong>Location:</strong> {providerDetails.address}</p>
//             <p><strong>Cost:</strong> ₹{providerDetails.price}</p>
//             <button
//               onClick={() => navigate('/parking-details', { state: { providerDetails, user } })}
//               className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
//             >
//               Book Now
//             </button>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }
