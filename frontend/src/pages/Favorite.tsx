import React, { useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { toast } from 'react-toastify';
import { ParkingSpace } from '../types/parking';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useMapContext } from '../context/MapContext';
import { parkingService } from '../services/parking.service';
import ParkingMarker from '../components/map/ParkingMarker';
import axios from 'axios';
import { FaBackward, FaParking } from 'react-icons/fa';
import ParkingSpaceList from '../components/parking/ParkingSpaceList';
import { ArrowLeftCircleIcon, ArrowLeftSquare } from 'lucide-react';
import FilterBox from './Filterbox';
import { useAuth } from '../context/AuthContext';

export default function Favorite() {
  const navigate = useNavigate(); // Hook to navigate back
  const { search } = useLocation(); 
  const { viewport, setViewport } = useMapContext();
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  const [filters, setFilters] = useState({
    amenities: {
      covered: false,
      security: false,
      charging: false,
      cctv: false,
      wheelchair: false,
    },
    priceRange: [0, 500], // Default price range (in your currency)
  });
  
      // useEffect(() => {
      //   if (navigator.geolocation) {
      //     navigator.geolocation.getCurrentPosition(
      //       (position) => {
      //         const { latitude, longitude } = position.coords;
      //         setViewport({ ...viewport, latitude, longitude });
      //         setCurrentLocation({ lat: latitude, lng: longitude });
      //         fetchNearbyParkingSpaces(latitude, longitude);
         
      //       },
      //       (error) => {
      //         console.error('Location error:', error);
      //         toast.error('Could not get your location. Please enable location services.');
            
      //       }
      //     );
      //   }
      // }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const searchParams = new URLSearchParams(location.search);
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
    if (lat && lng) {
      setViewport({
        ...viewport,
        latitude: lat,
        longitude: lng,
        zoom: 15,
      });
      console.log(lat,lng);
      
      // setViewport({ ...viewport, lat, lng });
      setCurrentLocation({ lat, lng });
   
      fetchNearbyParkingSpaces(lat, lng);
    }
  }, [search]);

  const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
    try {
      const spaces = await parkingService.getNearbySpaces(lat, lng, 15000);
      setParkingSpaces(spaces);
    } catch (error) {
      toast.error('Failed to fetch parking spaces.');
    }
  };

  const fetchRoute = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
        {
          params: {
            alternatives: false,
            geometries: 'geojson',
            overview: 'full',
            steps: true,
            access_token: "pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A",
          },
        }
      );
      setRouteData(response.data.routes[0]);
    } catch (error) {
      toast.error('Failed to fetch route.');
    }
  };

  const handleMarkerClick = async (space: ParkingSpace) => {
    setSelectedSpace(space);
    if (currentLocation) {
      const { lat: originLat, lng: originLng } = currentLocation;
      const [destLng, destLat] = space.location.coordinates;
      await fetchRoute(originLat, originLng, destLat, destLng);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Back Button */}

        <ArrowLeftCircleIcon onClick={() => navigate(-1)}    className="absolute top-4 left-4 z-10 w-8 h-8"/>
       
        {/* <div className="absolute top-12  left-4 z-10  w-8 h-8"> */}
         
      <FilterBox filters={filters} onFilterChange={setFilters} />
        {/* </div> */}
  
      {/* Map */}
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {parkingSpaces.map((space) => (
          <ParkingMarker
            key={space._id}
            space={space}
            latitude={space.location.coordinates[1]}
            longitude={space.location.coordinates[0]}
            onClick={() => handleMarkerClick(space)}
            color="green"
            icon={FaParking}
          />
        ))}
      </Map>

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
               userLocation={selectedSpace || currentLocation}
             />
    </div>
  );
}
