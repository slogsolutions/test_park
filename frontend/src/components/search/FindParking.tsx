import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Map, Source, Layer, LngLat } from 'react-map-gl'; // Import the necessary components
import { parkingService } from '../../services/parking.service';
import Loader from '../../pages/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
const socket = io(import.meta.env.VITE_SOCKET_URL); // Replace with your backend WebSocket URL

export default function FindParking() {
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const { user } = useAuth(); 
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 12,
  });

  // Get user's current location
  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(userCoords);
        setLocation('Current Location');
        setViewport({
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          zoom: 12,
        });
      },
      (error) => alert('Failed to get location')
    );
  };

  // Search for nearby parking
  const handleSearch = async () => {
    if (!coords) {
      alert('Please enter a location or use "Find My Location"');
      return;
    }

    setLoading(true);

    try {
      const results = await parkingService.getNearbySpaces(
        coords.lat, // Correct way to access latitude
  coords.lng,
      200000, // 5km radius
      );

      setProviders(results);
      socket.emit('notify-nearby-providers', { 
        userLat: coords.lat, 
        userLng: coords.lng,
        userId: user?._id, // Send user ID
        userName: user?.name, // Send user name
        userVehicle: user?.vehicle || 'Unknown Vehicle', // If available
        userContact: user?.phone || 'No Contact Info', // Optional
      });
    } catch (error) {
      console.error('Error fetching parking spots:', error);
    }

    setLoading(false);
  };

  // Listen for provider acceptance
  useEffect(() => {
    console.log("inside providre-accept use effect");
    
    socket.on('provider-accepted', (providerData) => {
      console.log("socker is on for provider-accepted");
      
      setSelectedProvider(providerData);
    });

    return () => {
      socket.off('provider-accepted');
    };
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Find Parking</h2>

      {/* Search Input & Location button */}
      <div className="flex gap-2">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
        />
        <button onClick={getCurrentLocation}>Find My Location</button>
      </div>

      {/* Search button */}
      <button className="mt-4" onClick={handleSearch}>
        Search
      </button>

      {/* Loader */}
      {loading && <Loader />}

      {/* Map Container */}
      <div className="mt-6" style={{ height: '400px', width: '100%' }}>
        <Map
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          mapboxAccessToken='pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A' // Using environment variable for Mapbox token
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          {/* Add markers for providers */}
          {providers.map((provider) => (
            <Source key={provider._id} type="geojson" data={{
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [provider.location.coordinates[0], provider.location.coordinates[1]],
                },
                properties: {
                  title: provider.title,
                },
              }],
            }}>
              <Layer
                id="marker"
                type="symbol"
                layout={{
                  'icon-image': 'marker-15', // Mapbox marker icon
                  'icon-size': 1.5,
                }}
              />
            </Source>
          ))}
        </Map>
      </div>

      {/* Parking Space Results */}
      {/* {!loading && providers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Available Parking Spaces:</h3>
          <ul>
            {providers.map((provider) => (
              <li key={provider._id} className="border p-2 my-2 rounded">
                <strong>{provider.title}</strong> - {provider.address.city}
              </li>
            ))}
          </ul>
        </div>
      )} */}

      {/* Provider Acceptance */}
      {selectedProvider && (
        <div className="mt-6 border p-4 rounded">
          <h3 className="text-lg font-bold">Provider Details</h3>
          <p>Name: {selectedProvider.name}</p>
          <p>Location: {selectedProvider.location}</p>
          {/* <p>Location: {selectedProvider.location}</p> */}
          <button className="mt-4 bg-green-500">Pay Now</button>
        </div>
      )}
    </div>
  );
}


