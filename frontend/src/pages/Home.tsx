import React, { useEffect, useState, useCallback } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import { toast } from 'react-toastify';
import { ParkingSpace } from '../types/parking';
import ParkingSpaceList from '../components/parking/ParkingSpaceList';
import ParkingMarker from '../components/map/ParkingMarker';
import ParkingPopup from '../components/map/ParkingPopup';
import { useMapContext } from '../context/MapContext';
import { parkingService } from '../services/parking.service';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GeocodingResult } from '../utils/geocoding';
import { MdLocationOn, MdFilterList, MdGpsFixed, MdSearch, MdMyLocation, MdClose } from 'react-icons/md';
import { FaParking, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella } from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import { SearchOverlay } from './SearchOverlayProps';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

export default function Home() {
  const { viewport, setViewport } = useMapContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [popupTimeout, setPopupTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Filters state - removed default price filter
  const [filters, setFilters] = useState({
    amenities: {
      covered: false,
      security: false,
      charging: false,
      cctv: false,
      wheelchair: false,
    },
    priceRange: [0, 1000],
    isPriceFilterActive: false, // New state to track if price filter is active
  });

  // Filter amenities configuration
  const amenityFilters = [
    {
      id: 'covered',
      label: 'Covered',
      icon: FaUmbrella,
      description: 'Protected from weather'
    },
    {
      id: 'security',
      label: 'Security',
      icon: FaShieldAlt,
      description: '24/7 security guard'
    },
    {
      id: 'charging',
      label: 'EV Charging',
      icon: FaBolt,
      description: 'Electric vehicle charging'
    },
    {
      id: 'cctv',
      label: 'CCTV',
      icon: FaVideo,
      description: 'Surveillance cameras'
    },
    {
      id: 'wheelchair',
      label: 'Accessible',
      icon: FaWheelchair,
      description: 'Wheelchair accessible'
    }
  ];

  // ---------- NEW: price meta helper ----------
  const computePriceMeta = (space: any) => {
    // prefer priceParking, then pricePerHour, then price
    const baseRaw = space?.priceParking ?? space?.pricePerHour ?? space?.price ?? 0;
    const base = Number(baseRaw) || 0;
    const rawDiscount = space?.discount ?? 0;
    const discount = Number(rawDiscount);
    const clamped = Number.isFinite(discount) ? Math.max(0, Math.min(100, discount)) : 0;
    const discounted = +(base * (1 - clamped / 100)).toFixed(2);
    return {
      basePrice: +base.toFixed(2),
      discountedPrice: discounted,
      discountPercent: clamped,
      hasDiscount: clamped > 0 && discounted < base,
    };
  };
  // --------------------------------------------

  // Apply filters whenever parkingSpaces, filters, or searchQuery change
  // TEMP: bypass all client-side filters for debugging
useEffect(() => {
  // directly show everything we got from the API so we can tell
  // whether the backend returned all spaces.
  setFilteredSpaces(parkingSpaces);
}, [parkingSpaces]);


  // Debounced popup close function
  const debouncedClosePopup = useCallback(() => {
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    
    if (!isPopupHovered) {
      const timeout = setTimeout(() => {
        setSelectedSpace(null);
      }, 300);
      
      setPopupTimeout(timeout);
    }
  }, [popupTimeout, isPopupHovered]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeout) {
        clearTimeout(popupTimeout);
      }
    };
  }, [popupTimeout]);

  useEffect(() => {
    const getLocation = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (permission.state === 'granted') {
            getUserLocation();
          } else if (permission.state === 'prompt') {
            getUserLocation();
          } else {
            setDefaultLocation();
          }
        } else {
          getUserLocation();
        }
      } catch (error) {
        setDefaultLocation();
      }
    };

    getLocation();
  }, []);

  const setDefaultLocation = () => {
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    setViewport({ 
      ...viewport, 
      latitude: defaultLat, 
      longitude: defaultLng,
      zoom: 12
    });
    setCurrentLocation({ lat: defaultLat, lng: defaultLng });
    fetchNearbyParkingSpaces(defaultLat, defaultLng);
    setLoading(false);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setDefaultLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewport({ 
          ...viewport, 
          latitude, 
          longitude,
          zoom: 14
        });
        setCurrentLocation({ lat: latitude, lng: longitude });
        fetchNearbyParkingSpaces(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        console.error('Location error:', error);
        toast.error(
          <div className="flex items-center justify-between">
            <span>Could not get your location. Please enable location services.</span>
            <button
              onClick={() => {
                if (navigator.userAgent.includes('Chrome')) {
                  window.open('chrome://settings/content/location', '_blank');
                } else if (navigator.userAgent.includes('Firefox')) {
                  window.open('about:preferences#privacy', '_blank');
                } else {
                  window.open('chrome://settings/content/location', '_blank');
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 ml-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Enable Location
            </button>
          </div>,
          { autoClose: false }
        );
        setDefaultLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const spaces = await parkingService.getAllSpaces();


      // Attach computed price meta to each space so list & popup can use it
      const spacesWithPrice = (spaces || []).map((s: any) => {
        return { ...s, __price: s.__price ?? computePriceMeta(s) };
      });

      setParkingSpaces(spacesWithPrice);
      
      if (spacesWithPrice && spacesWithPrice.length > 0) {
        setTimeout(() => {
          setViewport(prev => ({
            ...prev,
            zoom: Math.min(prev.zoom ?? 12, 14)
          }));
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByCurrentLocation = () => {
    if (currentLocation) {
      setSearchedLocation(null);
      setSearchQuery('');
      setViewport({
        ...viewport,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        zoom: 14,
      });
      fetchNearbyParkingSpaces(currentLocation.lat, currentLocation.lng);
      toast.success('Searching parking spaces near your current location');
    } else {
      toast.info('Current location not available.');
    }
  };

  const handleMarkerClick = async (space: ParkingSpace) => {
    setSelectedSpace(space);
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
    
    setViewport((prev) => ({
      ...prev,
      latitude: space.location.coordinates[1],
      longitude: space.location.coordinates[0],
      zoom: Math.max(prev.zoom ?? 12, 15),
    }));

    if (currentLocation) {
      const { lat: originLat, lng: originLng } = currentLocation;
      const [destLng, destLat] = space.location.coordinates;
      await fetchRoute(originLat, originLng, destLat, destLng);
    }
  };

  const handleMarkerHover = (space: ParkingSpace) => {
    setSelectedSpace(space);
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
  };

  const handlePopupMouseEnter = () => {
    setIsPopupHovered(true);
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
  };

  const handlePopupMouseLeave = () => {
    setIsPopupHovered(false);
    debouncedClosePopup();
  };

  const handleClosePopup = () => {
    setSelectedSpace(null);
    if (popupTimeout) {
      clearTimeout(popupTimeout);
    }
  };

  const handleFilterToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity as keyof typeof prev.amenities]
      }
    }));
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [min, max],
      isPriceFilterActive: true // Activate price filter when user changes it
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      amenities: {
        covered: false,
        security: false,
        charging: false,
        cctv: false,
        wheelchair: false,
      },
      priceRange: [0, 1000],
      isPriceFilterActive: false, // Reset price filter active state
    });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    const activeAmenities = Object.values(filters.amenities).filter(Boolean).length;
    const isPriceFiltered = filters.isPriceFilterActive;
    const hasSearchQuery = searchQuery.trim() !== '';
    return activeAmenities + (isPriceFiltered ? 1 : 0) + (hasSearchQuery ? 1 : 0);
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
            access_token: 'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
          },
        }
      );
      setRouteData(response.data.routes[0]);
    } catch (error) {
      console.error('Route fetch error:', error);
    }
  };

  const handleGoToCurrentLocation = () => {
    if (currentLocation) {
      setViewport({
        ...viewport,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        zoom: 15,
      });
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

  // Real geocoding function using Mapbox API
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: 'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
            limit: 5,
            types: 'place,locality,neighborhood,address',
            proximity: currentLocation ? `${currentLocation.lng},${currentLocation.lat}` : undefined,
          },
        }
      );

      const results: GeocodingResult[] = response.data.features.map((feature: any) => ({
        latitude: feature.center[1],
        longitude: feature.center[0],
        address: feature.place_name,
      }));

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search locations');
    }
  };

  const handleLocationSelect = async (result: GeocodingResult) => {
    setSearchedLocation({ lat: result.latitude, lng: result.longitude });
    setSearchQuery(result.address || '');
    setViewport({ 
      ...viewport, 
      longitude: result.longitude, 
      latitude: result.latitude,
      zoom: 14 
    });
    setShowSearchResults(false);

    try {
      setLoading(true);
      const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, );

      // Attach price meta
      const spacesWithPrice = (spaces || []).map((s: any) => {
        return { ...s, __price: s.__price ?? computePriceMeta(s) };
      });

      setParkingSpaces(spacesWithPrice);
      
      if (!spacesWithPrice || spacesWithPrice.length === 0) {
        toast.info('No parking spaces found in this area. Try increasing the search radius.');
      } else {
        toast.success(`Found ${spacesWithPrice.length} parking spaces near ${result.address.split(',')[0]}`);
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces for the selected location.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchLocations(query), 300),
    [currentLocation]
  );

  const handleSearchInputChange = async (query: string) => {
    setSearchQuery(query);
    await searchLocations(query);
    debouncedSearch(query);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl z-10" />
            <input
              type="text"
              placeholder="Search for locations, areas, or landmarks..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium placeholder-gray-500 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                  if (currentLocation) {
                    fetchNearbyParkingSpaces(currentLocation.lat, currentLocation.lng);
                  }
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MdClose className="text-xl" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-30 max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                >
                  <MdLocationOn className="text-blue-500 text-xl flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">
                      {result.address.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.address.split(',').slice(1).join(',').trim()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters Button */}
      <div className="absolute top-20 right-4 z-10">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white flex items-center gap-2 border border-white/20"
          title="Filter parking spaces"
        >
          <MdFilterList className="text-xl text-blue-600" />
          <span className="font-semibold text-gray-700">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-28 right-4 z-10 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Filter Parking</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>Price Range</span>
              <span className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-medium">
                {filters.isPriceFilterActive 
                  ? `₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}/hr`
                  : 'Any price'
                }
              </span>
            </h4>
            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <span>₹0</span>
              <span>₹1000</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceRangeChange(filters.priceRange[0], parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Amenities</h4>
            <div className="space-y-2">
              {amenityFilters.map((amenity) => {
                const IconComponent = amenity.icon;
                const isActive = filters.amenities[amenity.id as keyof typeof filters.amenities];
                
                return (
                  <button
                    key={amenity.id}
                    onClick={() => handleFilterToggle(amenity.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm' 
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <IconComponent className="text-lg" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-800">{amenity.label}</div>
                      <div className="text-xs text-gray-500">{amenity.description}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isActive && (
                        <span className="text-white text-sm font-bold">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-b-2xl">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">
                Showing {filteredSpaces.length} of {parkingSpaces.length} spaces
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Location Button */}
      <div className="absolute bottom-24 right-4 z-10">
        <button
          onClick={handleGoToCurrentLocation}
          className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white border border-white/20 group"
          title="Go to current location"
        >
          <MdGpsFixed className="text-2xl text-blue-600 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Map Container */}
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
              color="#3b82f6"
              isCurrentLocation={true}
              icon={FaMapMarkerAlt}
            />
          )}

          {/* Parking Spaces Markers */}
          {filteredSpaces.map((space) => {
            const key = typeof space._id === 'object' && (space._id as any).toString
              ? (space._id as any).toString()
              : (space._id as string);

            return (
              <ParkingMarker
                key={key}
                space={space}
                latitude={space.location.coordinates[1]}
                longitude={space.location.coordinates[0]}
                onClick={() => handleMarkerClick(space)}
                onMouseEnter={() => handleMarkerHover(space)}
                onMouseLeave={debouncedClosePopup}
                color="#10b981"
                icon={FaParking}
              />
            );
          })}

          {/* Route Visualization */}
          {routeSourceData && (
            <Source id="route" type="geojson" data={routeSourceData}>
              <Layer {...routeLayer} />
            </Source>
          )}

          {/* Searched Location Marker */}
          {searchedLocation && (
            <ParkingMarker
              latitude={searchedLocation.lat}
              longitude={searchedLocation.lng}
              color="#ef4444"
              icon={() => <MdLocationOn style={{ fontSize: '28px', color: '#ef4444' }} />}
              isCurrentLocation={false}
            />
          )}

          {/* Parking Popup */}
          {selectedSpace && (
            <ParkingPopup
              space={selectedSpace}
              onClose={handleClosePopup}
              onMouseEnter={handlePopupMouseEnter}
              onMouseLeave={handlePopupMouseLeave}
              user={user ?? null}
            />
          )}
        </Map>
      </div>

      {/* Parking List Sidebar */}
      <div className="absolute top-20 left-4 w-96 z-10 h-[480px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold mb-1">Find your perfect parking...</h2>
          <p className="text-blue-100 text-sm opacity-90">Discover ideal spots tailored for you</p>
        </div>

        {/* Search and Controls Section */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          {/* Controls Row */}
          <div className="flex gap-3">
            {/* Current Location Search */}
            <button
              onClick={handleSearchByCurrentLocation}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <MdMyLocation className="text-lg" />
              <span>Near Me</span>
            </button>

            
          </div>
        </div>
        
        {/* Parking Spaces List */}
        <div className="h-full overflow-auto">
          <ParkingSpaceList
            spaces={filteredSpaces}
            onSpaceSelect={(space) => {
              handleMarkerClick(space);
            }}
            filters={filters}
            userLocation={searchedLocation || currentLocation}
          />
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
