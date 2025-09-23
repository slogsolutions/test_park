import React, { useEffect, useState } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { toast } from 'react-toastify';
import { ParkingSpace } from '../types/parking';
import LocationSearch from '../components/search/LocationSearch';
import ParkingSpaceList from '../components/parking/ParkingSpaceList';
import ParkingMarker from '../components/map/ParkingMarker';
import ParkingPopup from '../components/map/ParkingPopup';
import { useMapContext } from '../context/MapContext';
import { parkingService } from '../services/parking.service';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GeocodingResult } from '../utils/geocoding';
import { MdLocationOn } from 'react-icons/md';
import { FaParking, FaUserCircle } from 'react-icons/fa';
import { MdGpsFixed } from 'react-icons/md';
import { SearchBar } from './SearchBar';
import { SearchOverlay } from './SearchOverlayProps';
import FilterBox from './Filterbox';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import logo from '../../public/Park_your_Vehicle_log.png'

export default function Home() {
  const { viewport, setViewport } = useMapContext();
  const { user } = useAuth();
  const navigate=useNavigate()
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getUserLocation();
        } else if (result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => getUserLocation(position),
            (error) => {
              console.error('Location error:', error);
              toast.error(
                <div>
                  Could not get your location. Please enable location services.
                  {/* <button
                    onClick={() => {
                      if (navigator.userAgent.includes("Chrome")) {
                        window.open("chrome://settings/content/location", "_blank");
                      } else if (navigator.userAgent.includes("Firefox")) {
                        window.open("chrome://settings/content/location", "_blank");
                      } else {
                        window.open("chrome://settings/content/location", "_blank");
                      }
                    }}
                    className="bg-blue-600 text-white px-2 py-1 ml-2 rounded hover:bg-blue-700"
                  >
                    Enable Location
                  </button> */}
                </div>,
                { autoClose: false }
              );
            }
          );
        } else {
          toast.error(
            <div>
              Could not get your location. Please enable location services.
              {/* <button
                onClick={() => {
                  if (navigator.userAgent.includes("Chrome")) {
                    window.open("chrome://settings/content/location", "_blank");
                  } else if (navigator.userAgent.includes("Firefox")) {
                    window.open("about:preferences#privacy", "_blank");
                  } else {
                    window.open("chrome://settings/content/location", "_blank");
                  }
                }}
                className="bg-blue-600 text-white px-2 py-1 ml-2 rounded hover:bg-blue-700"
              >
                Enable Location
              </button> */}
            </div>,
            // { autoClose: false }
          );
            // toast.error('Location access is blocked. Enable it in your browser settings.');
        }
      });
    } else {
      getUserLocation(); // Fallback if Permissions API is not supported
    }
  }, []);
  
  const getUserLocation = (position?: GeolocationPosition) => {
    if (position) {
      const { latitude, longitude } = position.coords;
      setViewport({ ...viewport, latitude, longitude });
      setCurrentLocation({ lat: latitude, lng: longitude });
      fetchNearbyParkingSpaces(latitude, longitude);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => getUserLocation(position),
        (error) => {
          console.error('Location error:', error);
          toast.error(
            <div>
              Could not get your location. Please enable location services.
              <button
                onClick={() => {
                  if (navigator.userAgent.includes("Chrome")) {
                    window.open("chrome://settings/content/location", "_blank");
                  } else if (navigator.userAgent.includes("Firefox")) {
                    window.open("about:preferences#privacy", "_blank");
                  } else {
                    window.open("chrome://settings/content/location", "_blank");
                  }
                }}
                className="bg-blue-600 text-white px-2 py-1 ml-2 rounded hover:bg-blue-700"
              >
                Enable Location
              </button>
            </div>,
            { autoClose: false }
          );
     
        }
      );
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
          setLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Could not get your location. Please enable location services.');
          setLoading(false);
        }
      );
    }
  }, []);

  const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
    try {
      const spaces = await parkingService.getNearbySpaces(lat, lng, searchRadius);
      setParkingSpaces(spaces);
    } catch (error) {
      toast.error('Failed to fetch parking spaces.');
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

  const handleGoToCurrentLocation = () => {
    if (currentLocation) {
      setViewport({
        ...viewport,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        zoom: 15, // Adjust zoom level as needed
      });
  
      // Fetch nearby parking spaces for the current location
      fetchNearbyParkingSpaces(currentLocation.lat, currentLocation.lng);
    } else {
      toast.info('Current location not available.');
    }
  };
  

  const routeLayer = {
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#3887be', 'line-width': 5 },
  };

  const routeSourceData = routeData
    ? {
        type: 'Feature',
        geometry: routeData.geometry,
      }
    : null;

  const handleLocationSelect = async (result: GeocodingResult) => {
    setSearchedLocation({ lat: result.latitude, lng: result.longitude });
    setViewport({ ...viewport, longitude: result.longitude, latitude: result.latitude });

    try {
      const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, searchRadius);
      setParkingSpaces(spaces);
      if (spaces.length === 0) {
        toast.info('No nearby parking spaces available at the selected location.');
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces for the selected location.');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
       <LoadingScreen/>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Search Box */}
      {/* <img src={logo} alt="logo" className="h-18 w-18 "  /> */}
      <div className="absolute top-4 left-4 right-4 z-10 ">

        <SearchBar onOpen={() => setIsSearchOpen(true)} />
        {/* <LocationSearch onLocationSelect={handleLocationSelect} onGoToCurrentLocation={handleGoToCurrentLocation}/> */}
      </div>
      {/* <FilterBox filters={filters} onFilterChange={setFilters} /> */}

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Go to Current Location Button */}
     {/* Go to Current Location Button */}
{/* <div className="absolute bottom-48 right-4 z-10">
  <button
    onClick={handleGoToCurrentLocation}
    className="bg-blue-600 text-white px-3 py-2 rounded shadow-lg hover:bg-blue-700"
  >
     <MdGpsFixed size={20} />
    Go to Current Location
  </button>
</div> */}


      <div className="relative h-full">
        <Map
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <ParkingMarker
              latitude={currentLocation.lat}
              longitude={currentLocation.lng}
              color="blue"
              isCurrentLocation={true}
              icon={FaUserCircle}
            />
          )}

          {/* Parking Spaces Markers */}
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

          {/* Route Layer */}

          {/* for showing the distance of user to page  */}
          {/* {routeSourceData && (
            <Source id="route" type="geojson" data={routeSourceData}>
              <Layer {...routeLayer} />
            </Source>
          )} */}

          {/* Parking Space Popup */}
          {/* {selectedSpace && (
            <ParkingPopup
              space={selectedSpace}
              onClose={() => setSelectedSpace(null)}
              user={user}
            />
          )} */}

          {/* Searched Location Marker */}
          {searchedLocation && (
            <ParkingMarker
              latitude={searchedLocation.lat}
              longitude={searchedLocation.lng}
              color="blue"
              icon={() => <MdLocationOn style={{ fontSize: '30px', color: 'red' }} />}
              isCurrentLocation={false}
              
            />
          )}
        </Map>
      </div>

      {/* Parking Space List */}
      {/* <ParkingSpaceList
  spaces={parkingSpaces}
  onSpaceSelect={(space) => {
    setSelectedSpace(space);
    setViewport({
      ...viewport,
      latitude: space.location.coordinates[1],
      longitude: space.location.coordinates[0],
    });
  }}
  searchRadius={searchRadius}
  onRadiusChange={setSearchRadius}
  filters={filters} 
  userLocation={searchedLocation || currentLocation} // Use searched or current location
/> */}

{/* <ParkingSpaceList
  spaces={parkingSpaces}
  onSpaceSelect={(space) => {
    navigate('/parking-details', { state: { space } });
  }}
  searchRadius={searchRadius}
  onRadiusChange={setSearchRadius}
  filters={filters}
  userLocation={searchedLocation || currentLocation}
/> */}


    </div>
  );
}
