import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Navigation } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ParkingSpace {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  availableSpots: number;
  totalSpots: number;
  distance?: number;
}

interface MapComponentProps {
  onParkingSpacesUpdate: (spaces: ParkingSpace[]) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onParkingSpacesUpdate }) => {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 14
  });
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserLocation([longitude, latitude]);
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchNearbyParkingSpaces = async () => {
      if (!userLocation) return;
      
      try {
        const response = await fetch(
          `http://localhost:3000/api/parking-spaces/nearby?lng=${userLocation[0]}&lat=${userLocation[1]}`
        );
        const data = await response.json();
        setParkingSpaces(data);
        onParkingSpacesUpdate(data);
      } catch (error) {
        console.error('Error fetching parking spaces:', error);
      }
    };

    fetchNearbyParkingSpaces();
  }, [userLocation, onParkingSpacesUpdate]);

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/standard-satellite"
      mapboxAccessToken='pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A'
    >
      {userLocation && (
        <Marker
          longitude={userLocation[0]}
          latitude={userLocation[1]}
          anchor="center"
        >
          <div className="relative p-2 rounded-full bg-blue-500 border-2 border-white">
            <Navigation className="h-4 w-4 text-white" />
          </div>
        </Marker>
      )}

      {parkingSpaces.map((space) => (
        <Marker
          key={space._id}
          longitude={space.location.coordinates[0]}
          latitude={space.location.coordinates[1]}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            setSelectedSpace(space);
          }}
        >
          <MapPin className="h-6 w-6 text-red-600" />
        </Marker>
      ))}

      {selectedSpace && (
        <Popup
          longitude={selectedSpace.location.coordinates[0]}
          latitude={selectedSpace.location.coordinates[1]}
          anchor="bottom"
          onClose={() => setSelectedSpace(null)}
        >
          <div className="p-2">
            <h3 className="font-bold">{selectedSpace.name}</h3>
            <p>Available spots: {selectedSpace.availableSpots} / {selectedSpace.totalSpots}</p>
            {selectedSpace.distance && (
              <p className="text-sm text-gray-600">{selectedSpace.distance.toFixed(1)} km away</p>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default MapComponent;