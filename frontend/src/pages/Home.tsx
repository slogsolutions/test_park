// src/pages/Home.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { FaParking, FaMapMarkerAlt, FaShieldAlt, FaBolt, FaWheelchair, FaVideo, FaUmbrella } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import { useSocket } from '../context/SocketContext';

export default function Home() {
  const { viewport, setViewport } = useMapContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [popupTimeout, setPopupTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFilterActive, setIsSearchFilterActive] = useState(false); // <-- only apply text filter when true
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    amenities: {
      covered: false,
      security: false,
      charging: false,
      cctv: false,
      wheelchair: false,
    },
    priceRange: [0, 1000] as [number, number],
    isPriceFilterActive: false,
  });

  // Amenity config
  const amenityFilters = [
    { id: 'covered', label: 'Covered', icon: FaUmbrella, description: 'Protected from weather' },
    { id: 'security', label: 'Security', icon: FaShieldAlt, description: '24/7 security guard' },
    { id: 'charging', label: 'EV Charging', icon: FaBolt, description: 'Electric vehicle charging' },
    { id: 'cctv', label: 'CCTV', icon: FaVideo, description: 'Surveillance cameras' },
    { id: 'wheelchair', label: 'Accessible', icon: FaWheelchair, description: 'Wheelchair accessible' },
  ];

  // ---------- price meta helper ----------
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

  // ---------- only-approve helper ----------
  const onlyApproved = (spaces: any[] | undefined | null) => {
    if (!Array.isArray(spaces)) return [];
    return spaces.filter((s) => {
      const status = String(s?.status || '').toLowerCase();
      // require explicit isOnline === true (be strict — if missing or false, treat as offline)
      const online = typeof s?.isOnline !== 'undefined' ? Boolean(s.isOnline) : false;
      return status === 'submitted' && online;
    });
  };

  // -------------------------------------------------------------

  // Keep filteredSpaces in sync with parkingSpaces (we bypass client-side filters for now)
  useEffect(() => {
    setFilteredSpaces(parkingSpaces);
  }, [parkingSpaces]);

  useEffect(() => {
    if (!socket) return;

    const handleParkingUpdate = (data: any) => {
      if (!data) return;
      const parkingId = data.parkingId || data._id || data.id;
      const availableSpots =
        typeof data.availableSpots === 'number' ? data.availableSpots : data.available || data.availableSpots;
      if (!parkingId || typeof availableSpots !== 'number') return;

      setParkingSpaces((prev) => {
        const pid = String(parkingId);
        const foundIdx = prev.findIndex((s: any) => {
          const sid = s._id ? (typeof s._id === 'string' ? s._id : String(s._id)) : s.id;
          return sid === pid;
        });

        const incomingStatus = String(data.status || '').toLowerCase();
        const incomingOnline = typeof data.isOnline !== 'undefined' ? Boolean(data.isOnline) : true;

        // If incoming status exists and is not approved OR the incoming update explicitly marks the space offline -> remove the space
        if ((incomingStatus && incomingStatus !== 'submitted') || incomingOnline === false) {
          if (foundIdx >= 0) {
            const copy = [...prev];
            copy.splice(foundIdx, 1);
            return copy;
          }
          return prev;
        }

        // Otherwise incoming is approved (or no status given) and is online -> update or append
        if (foundIdx >= 0) {
          const copy = [...prev];
          copy[foundIdx] = { ...copy[foundIdx], ...data, availableSpots };
          return copy;
        } else {
          // only append if approved AND online
          if ((data.status && String(data.status).toLowerCase() !== 'submitted') || (typeof data.isOnline !== 'undefined' && !data.isOnline)) {
            return prev;
          }
          const newSpace = { ...data, __price: data.__price ?? computePriceMeta(data) };
          return [newSpace, ...prev];
        }
      });

      setFilteredSpaces((prev) => {
        const pid = String(parkingId);
        const foundIdx = prev.findIndex((s: any) => {
          const sid = s._id ? (typeof s._id === 'string' ? s._id : String(s._id)) : s.id;
          return sid === pid;
        });

        const incomingStatus = String(data.status || '').toLowerCase();
        const incomingOnline = typeof data.isOnline !== 'undefined' ? Boolean(data.isOnline) : true;

        // If incoming status exists and is not approved OR incoming explicitly offline -> remove from filtered list
        if ((incomingStatus && incomingStatus !== 'submitted') || incomingOnline === false) {
          if (foundIdx >= 0) {
            const copy = [...prev];
            copy.splice(foundIdx, 1);
            return copy;
          }
          return prev;
        }

        if (foundIdx >= 0) {
          const copy = [...prev];
          copy[foundIdx] = { ...copy[foundIdx], ...data, availableSpots };
          return copy;
        } else {
          if ((data.status && String(data.status).toLowerCase() !== 'submitted') || (typeof data.isOnline !== 'undefined' && !data.isOnline)) return prev;
          const newSpace = { ...data, __price: data.__price ?? computePriceMeta(data) };
          return [newSpace, ...prev];
        }
      });

      // If selected becomes non-approved or offline, clear it; otherwise update selected
      setSelectedSpace((prev) => {
        if (!prev) return prev;
        const sid = prev._id ? (typeof prev._id === 'string' ? prev._id : String(prev._id)) : prev.id;
        if (sid === String(parkingId)) {
          if ((data.status && String(data.status).toLowerCase() !== 'submitted') || (typeof data.isOnline !== 'undefined' && !data.isOnline)) {
            return null;
          }
          return { ...prev, availableSpots, ...data };
        }
        return prev;
      });
    };

    socket.on('parking-updated', handleParkingUpdate);
    socket.on('parking-released', handleParkingUpdate);

    return () => {
      socket.off('parking-updated', handleParkingUpdate);
      socket.off('parking-released', handleParkingUpdate);
    };
  }, [socket]);

  // Debounced popup close
  const debouncedClosePopup = useCallback(() => {
    if (popupTimeout) clearTimeout(popupTimeout);
    if (!isPopupHovered) {
      const timeout = setTimeout(() => setSelectedSpace(null), 300);
      setPopupTimeout(timeout);
    }
  }, [popupTimeout, isPopupHovered]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeout) clearTimeout(popupTimeout);
    };
  }, [popupTimeout]);

  // ----- Geolocation & initial load -----
  useEffect(() => {
    const init = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (permission.state === 'granted' || permission.state === 'prompt') {
            await getUserLocation();
          } else {
            await setDefaultLocation();
          }
        } else {
          await getUserLocation();
        }
      } catch {
        await setDefaultLocation();
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDefaultLocation = async () => {
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;
    setViewport({
      ...viewport,
      latitude: defaultLat,
      longitude: defaultLng,
      zoom: 16,
      pitch: 30,
      bearing: -10,
    });
    setCurrentLocation({ lat: defaultLat, lng: defaultLng });
    await loadDefaultParkingMarkers(defaultLat, defaultLng);
    setLoading(false);
  };

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      await setDefaultLocation();
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setViewport({
            ...viewport,
            latitude,
            longitude,
            zoom: 16,
            pitch: 35,
            bearing: -12,
          });
          setCurrentLocation({ lat: latitude, lng: longitude });
          await loadDefaultParkingMarkers(latitude, longitude);
          setLoading(false);
          resolve();
        },
        async (error) => {
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
          await setDefaultLocation();
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  // Load default markers (only approved)
  const loadDefaultParkingMarkers = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      if (typeof (parkingService as any).getAllSpaces === 'function') {
        try {
          const all = await (parkingService as any).getAllSpaces();
          if (Array.isArray(all) && all.length > 0) {
            const allowed = onlyApproved(all).map((s) => ({ ...s, __price: s.__price ?? computePriceMeta(s) }));
            setParkingSpaces(allowed);
            return;
          }
        } catch (err) {
          console.warn('getAllSpaces failed, falling back to getNearbySpaces', err);
        }
      }

      const spaces = await parkingService.getNearbySpaces(lat, lng);
      const allowed = onlyApproved(spaces).map((s) => ({ ...s, __price: s.__price ?? computePriceMeta(s) }));
      setParkingSpaces(allowed || []);
    } catch (err) {
      console.error('Failed to load default parking markers', err);
      setParkingSpaces([]);
      toast.error('Failed to load parking markers.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearby when searching or fetching all (only approved)
  const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const spaces = await parkingService.getAllSpaces();

      const spacesWithPrice = (spaces || []).map((s: any) => {
        return { ...s, __price: s.__price ?? computePriceMeta(s) };
      });

      const allowed = onlyApproved(spacesWithPrice);
      setParkingSpaces(allowed);

      if (allowed && allowed.length > 0) {
        setTimeout(() => {
          setViewport((prev) => ({
            ...prev,
            zoom: Math.min((prev.zoom ?? 9), 11),
          }));
        }, 500);
      }
    } catch (error) {
      console.error('Failed to fetch parking spaces.', error);
      toast.error('Failed to fetch parking spaces.');
    } finally {
      setLoading(false);
    }
  };

  // ----- Handlers -----
  const handleSearchByCurrentLocation = () => {
    if (currentLocation) {
      setIsSearchFilterActive(false);
      setSearchedLocation(null);
      setSearchQuery('');
      setViewport({ ...viewport, latitude: currentLocation.lat, longitude: currentLocation.lng, zoom: 16 });
      loadDefaultParkingMarkers(currentLocation.lat, currentLocation.lng);
      toast.success('Showing parking spaces around you');
    } else {
      toast.info('Current location not available.');
    }
  };

  const handleMarkerClick = async (space: ParkingSpace) => {
    setSelectedSpace(space);
    if (popupTimeout) clearTimeout(popupTimeout);

    // Center map on marker but DO NOT force a very large zoom.
    // This keeps the user's current zoom level (no jump).
    setViewport((prev) => ({
      ...prev,
      latitude: space.location.coordinates[1],
      longitude: space.location.coordinates[0],
      // removed forced Math.max(prev.zoom ?? 16, 20) to avoid extreme zoom
      // keeping zoom unchanged preserves the current map view.
    }));

    if (currentLocation) {
      const { lat: originLat, lng: originLng } = currentLocation;
      const [destLng, destLat] = space.location.coordinates;
      await fetchRoute(originLat, originLng, destLat, destLng);
    }
  };

  const handleMarkerHover = (space: ParkingSpace) => {
    setSelectedSpace(space);
    if (popupTimeout) clearTimeout(popupTimeout);
  };

  const handlePopupMouseEnter = () => {
    setIsPopupHovered(true);
    if (popupTimeout) clearTimeout(popupTimeout);
  };

  const handlePopupMouseLeave = () => {
    setIsPopupHovered(false);
    debouncedClosePopup();
  };

  const handleClosePopup = () => {
    setSelectedSpace(null);
    if (popupTimeout) clearTimeout(popupTimeout);
  };

  const handleFilterToggle = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity as keyof typeof prev.amenities],
      },
    }));
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [min, max],
      isPriceFilterActive: true,
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
      isPriceFilterActive: false,
    });
    setSearchQuery('');
    setIsSearchFilterActive(false);
  };

  const getActiveFilterCount = () => {
    const activeAmenities = Object.values(filters.amenities).filter(Boolean).length;
    const isPriceFiltered = filters.isPriceFilterActive;
    const hasSearchQuery = isSearchFilterActive && searchQuery.trim() !== '';
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
            access_token:
              'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
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
      setViewport({ ...viewport, latitude: currentLocation.lat, longitude: currentLocation.lng, zoom: 16 });
      loadDefaultParkingMarkers(currentLocation.lat, currentLocation.lng);
    } else {
      toast.info('Current location not available.');
    }
  };

  // Route layer setup
  const routeLayer = {
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#3887be', 'line-width': 5 },
  };

  const routeSourceData = routeData ? { type: 'Feature', geometry: routeData.geometry } : null;

  // Mapbox geocoding for the search box
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
            access_token:
              'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
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

  // When user selects a search suggestion: center map & fetch that area's parkings,
  // but DO NOT enable the textual list filter.
  const handleLocationSelect = async (result: GeocodingResult) => {
    // ensure textual filter is not applied
    setIsSearchFilterActive(false);

    // show the selected address in the input for UX, but it won't be used as filter
    setSearchQuery(result.address || '');
    setSearchedLocation({ lat: result.latitude, lng: result.longitude });
    setViewport({ ...viewport, longitude: result.longitude, latitude: result.latitude, zoom: 16 });
    setShowSearchResults(false);

    try {
      setLoading(true);
      const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude);

      // Attach price meta
      const spacesWithPrice = (spaces || []).map((s: any) => {
        return { ...s, __price: s.__price ?? computePriceMeta(s) };
      });

      // keep only approved
      const allowed = onlyApproved(spacesWithPrice);
      setParkingSpaces(allowed);

      if (!allowed || allowed.length === 0) {
        toast.info('No parking spaces found in this area. Try increasing the search radius.');
      } else {
        toast.success(`Found ${allowed.length} parking spaces near ${result.address.split(',')[0]}`);
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces for the selected location.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce((query: string) => searchLocations(query), 300), [currentLocation]);

  // When user types in input => enable textual filter behavior
  const handleSearchInputChange = async (query: string) => {
    setSearchQuery(query);

    // typing indicates user might want to filter by text
    setIsSearchFilterActive(true);

    await searchLocations(query);
    debouncedSearch(query);
  };

  // ----- Sidebar drag logic -----
  const [sidebarPos, setSidebarPos] = useState({ top: 80, left: 16 });
  const draggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const onPointerDownSidebar = (e: React.PointerEvent) => {
    draggingRef.current = true;
    const rect = sidebarRef.current?.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    dragOffset.current = {
      x: startX - (rect?.left ?? 0),
      y: startY - (rect?.top ?? 0),
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMoveWindow = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    const padding = 12;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const sidebarW = sidebarRef.current?.offsetWidth ?? 384;
    const sidebarH = sidebarRef.current?.offsetHeight ?? 480;
    const left = Math.max(padding, Math.min(winW - sidebarW - padding, x));
    const top = Math.max(padding, Math.min(winH - sidebarH - padding, y));
    setSidebarPos({ left, top });
  };

  const onPointerUpWindow = () => {
    draggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMoveWindow);
    window.addEventListener('pointerup', onPointerUpWindow);
    window.addEventListener('pointercancel', onPointerUpWindow);
    return () => {
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('pointerup', onPointerUpWindow);
      window.removeEventListener('pointercancel', onPointerUpWindow);
    };
  }, []);

  // ----- Loading UI -----
  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingScreen />
      </div>
    );
  }

  // ----- Render -----
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
                  setIsSearchFilterActive(false); // clear textual filter when user clears input
                  if (currentLocation) loadDefaultParkingMarkers(currentLocation.lat, currentLocation.lng);
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
                    <div className="font-medium text-gray-900 text-sm">{result.address.split(',')[0]}</div>
                    <div className="text-xs text-gray-500 truncate">{result.address.split(',').slice(1).join(',').trim()}</div>
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
                {filters.isPriceFilterActive ? `₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}/hr` : 'Any price'}
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
                      isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      <IconComponent className="text-lg" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-800">{amenity.label}</div>
                      <div className="text-xs text-gray-500">{amenity.description}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                      {isActive && <span className="text-white text-sm font-bold">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-b-2xl">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700">Showing {filteredSpaces.length} of {parkingSpaces.length} spaces</div>
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

      {/* Map */}
      <div className="relative h-full">
        <Map
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <ParkingMarker latitude={currentLocation.lat} longitude={currentLocation.lng} color="#3b82f6" isCurrentLocation={true} icon={FaMapMarkerAlt} />
          )}

          {/* Parking markers from filteredSpaces */}
          {filteredSpaces.map((space) => {
            const key =
              typeof space._id === 'object' && (space._id as any).toString ? (space._id as any).toString() : (space._id as string);
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

          {/* Route visualization */}
          {routeSourceData && (
            <Source id="route" type="geojson" data={routeSourceData}>
              <Layer {...routeLayer} />
            </Source>
          )}

          {/* Searched location marker */}
          {searchedLocation && (
            <ParkingMarker
              latitude={searchedLocation.lat}
              longitude={searchedLocation.lng}
              color="#ef4444"
              icon={() => <MdLocationOn style={{ fontSize: '28px', color: '#ef4444' }} />}
              isCurrentLocation={false}
            />
          )}

          {/* Popup */}
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

      {/* Draggable Sidebar */}
      <div
        ref={sidebarRef}
        style={{ top: sidebarPos.top, left: sidebarPos.left, width: 384 }}
        className="absolute z-40 h-[480px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20"
      >
        <div onPointerDown={onPointerDownSidebar} className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white cursor-grab select-none" style={{ touchAction: 'none' }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-1">Find your perfect parking...</h2>
              <p className="text-blue-100 text-sm opacity-90">Drag this panel anywhere</p>
            </div>
            <div>
              <button onClick={() => setSidebarPos({ top: 80, left: 16 })} className="bg-white/10 px-3 py-1 rounded-lg text-sm hover:bg-white/20">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex gap-3">
            <button
              onClick={handleSearchByCurrentLocation}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <MdMyLocation className="text-lg" />
              <span>Near Me</span>
            </button>
          </div>
        </div>

        <div className="h-full overflow-auto p-3">
          <ParkingSpaceList spaces={filteredSpaces} onSpaceSelect={(space) => handleMarkerClick(space)} filters={filters} userLocation={searchedLocation || currentLocation} />
        </div>
      </div>

      {/* Custom CSS */}
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

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
