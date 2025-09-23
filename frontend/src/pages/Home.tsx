// import React, { useEffect, useState } from 'react';
// import Map, { Source, Layer } from 'react-map-gl';
// import { toast } from 'react-toastify';
// import { ParkingSpace } from '../types/parking';
// import LocationSearch from '../components/search/LocationSearch';
// import ParkingSpaceList from '../components/parking/ParkingSpaceList';
// import ParkingMarker from '../components/map/ParkingMarker';
// import ParkingPopup from '../components/map/ParkingPopup';
// import { useMapContext } from '../context/MapContext';
// import { parkingService } from '../services/parking.service';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { GeocodingResult } from '../utils/geocoding';
// import { MdLocationOn } from 'react-icons/md';
// import { FaParking, FaUserCircle } from 'react-icons/fa';
// import { MdGpsFixed } from 'react-icons/md';
// import { SearchBar } from './SearchBar';
// import { SearchOverlay } from './SearchOverlayProps';
// import FilterBox from './Filterbox';
// import { useNavigate } from 'react-router-dom';
// import LoadingScreen from './LoadingScreen';
// import logo from '../../public/Park_your_Vehicle_log.png';

// export default function Home() {
//   const { viewport, setViewport } = useMapContext();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
//   const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
//   const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [searchRadius, setSearchRadius] = useState(5000);
//   const [loading, setLoading] = useState(true);
//   const [routeData, setRouteData] = useState<any>(null);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [filters, setFilters] = useState({
//     amenities: {
//       covered: false,
//       security: false,
//       charging: false,
//       cctv: false,
//       wheelchair: false,
//     },
//     priceRange: [0, 500],
//   });

//   useEffect(() => {
//     if ('permissions' in navigator) {
//       navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
//         if (result.state === 'granted') {
//           getUserLocation();
//         } else if (result.state === 'prompt') {
//           navigator.geolocation.getCurrentPosition(
//             (position) => getUserLocation(position),
//             (error) => {
//               console.error('Location error:', error);
//               toast.error(
//                 <div>
//                   Could not get your location. Please enable location services.
//                 </div>,
//                 { autoClose: false }
//               );
//             }
//           );
//         } else {
//           toast.error(
//             <div>
//               Could not get your location. Please enable location services.
//             </div>
//           );
//         }
//       }).catch(() => {
//         getUserLocation();
//       });
//     } else {
//       getUserLocation();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const getUserLocation = (position?: GeolocationPosition) => {
//     if (position) {
//       const { latitude, longitude } = position.coords;
//       setViewport({ ...viewport, latitude, longitude });
//       setCurrentLocation({ lat: latitude, lng: longitude });
//       fetchNearbyParkingSpaces(latitude, longitude);
//     } else {
//       navigator.geolocation.getCurrentPosition(
//         (position) => getUserLocation(position),
//         (error) => {
//           console.error('Location error:', error);
//           toast.error(
//             <div>
//               Could not get your location. Please enable location services.
//               <button
//                 onClick={() => {
//                   if (navigator.userAgent.includes('Chrome')) {
//                     window.open('chrome://settings/content/location', '_blank');
//                   } else if (navigator.userAgent.includes('Firefox')) {
//                     window.open('about:preferences#privacy', '_blank');
//                   } else {
//                     window.open('chrome://settings/content/location', '_blank');
//                   }
//                 }}
//                 className="bg-blue-600 text-white px-2 py-1 ml-2 rounded hover:bg-blue-700"
//               >
//                 Enable Location
//               </button>
//             </div>,
//             { autoClose: false }
//           );
//         }
//       );
//     }
//   };

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           setViewport({ ...viewport, latitude, longitude });
//           setCurrentLocation({ lat: latitude, lng: longitude });
//           fetchNearbyParkingSpaces(latitude, longitude);
//           setLoading(false);
//         },
//         (error) => {
//           console.error('Location error:', error);
//           toast.error('Could not get your location. Please enable location services.');
//           setLoading(false);
//         }
//       );
//     } else {
//       setLoading(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
//     try {
//       const spaces = await parkingService.getNearbySpaces(lat, lng, searchRadius);
//       setParkingSpaces(spaces || []);
//     } catch (error) {
//       toast.error('Failed to fetch parking spaces.');
//     }
//   };

//   const handleMarkerClick = async (space: ParkingSpace) => {
//     setSelectedSpace(space);
//     setViewport((prev) => ({
//       ...prev,
//       latitude: space.location.coordinates[1],
//       longitude: space.location.coordinates[0],
//       zoom: Math.max(prev.zoom ?? 13, 14),
//     }));

//     if (currentLocation) {
//       const { lat: originLat, lng: originLng } = currentLocation;
//       const [destLng, destLat] = space.location.coordinates;
//       await fetchRoute(originLat, originLng, destLat, destLng);
//     }
//   };

//   // Hover handler: opens popup but does NOT fetch route (keeps it lightweight)
//   const handleMarkerHover = (space: ParkingSpace) => {
//     setSelectedSpace(space);
//     setViewport((prev) => ({
//       ...prev,
//       latitude: space.location.coordinates[1],
//       longitude: space.location.coordinates[0],
//       // keep existing zoom - do not force zoom on hover
//     }));
//   };

//   const fetchRoute = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
//     try {
//       const response = await axios.get(
//         `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
//         {
//           params: {
//             alternatives: false,
//             geometries: 'geojson',
//             overview: 'full',
//             steps: true,
//             access_token:
//               'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
//           },
//         }
//       );
//       setRouteData(response.data.routes[0]);
//     } catch (error) {
//       toast.error('Failed to fetch route.');
//     }
//   };

//   const handleGoToCurrentLocation = () => {
//     if (currentLocation) {
//       setViewport({
//         ...viewport,
//         latitude: currentLocation.lat,
//         longitude: currentLocation.lng,
//         zoom: 15,
//       });
//       fetchNearbyParkingSpaces(currentLocation.lat, currentLocation.lng);
//     } else {
//       toast.info('Current location not available.');
//     }
//   };

//   const routeLayer = {
//     id: 'route',
//     type: 'line',
//     source: 'route',
//     layout: { 'line-cap': 'round', 'line-join': 'round' },
//     paint: { 'line-color': '#3887be', 'line-width': 5 },
//   };

//   const routeSourceData = routeData
//     ? {
//         type: 'Feature',
//         geometry: routeData.geometry,
//       }
//     : null;

//   const handleLocationSelect = async (result: GeocodingResult) => {
//     setSearchedLocation({ lat: result.latitude, lng: result.longitude });
//     setViewport({ ...viewport, longitude: result.longitude, latitude: result.latitude });

//     try {
//       const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, searchRadius);
//       setParkingSpaces(spaces);
//       if (!spaces || spaces.length === 0) {
//         toast.info('No nearby parking spaces available at the selected location.');
//       }
//     } catch (error) {
//       toast.error('Failed to fetch parking spaces for the selected location.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-[calc(100vh-64px)] flex items-center justify-center">
//         <LoadingScreen />
//       </div>
//     );
//   }

//   return (
//     <div className="h-[calc(100vh-64px)] relative">
//       <div className="absolute top-4 left-4 right-4 z-10 ">
//         <SearchBar onOpen={() => setIsSearchOpen(true)} />
//       </div>

//       <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

//       <div className="relative h-full">
//         {/* IMPORTANT: Popup must be rendered inside Map so it has Map context */}
//         <Map
//           {...viewport}
//           onMove={(evt) => setViewport(evt.viewState)}
//           mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
//           style={{ width: '100%', height: '100%' }}
//           mapStyle="mapbox://styles/mapbox/streets-v11"
//         >
//           {/* Current Location Marker */}
//           {currentLocation && (
//             <ParkingMarker
//               latitude={currentLocation.lat}
//               longitude={currentLocation.lng}
//               color="blue"
//               isCurrentLocation={true}
//               icon={FaUserCircle}
//             />
//           )}

//           {/* Parking Spaces Markers (hover opens popup, leave closes it) */}
//           {parkingSpaces.map((space) => {
//             const key =
//               typeof space._id === 'object' && (space._id as any).toString
//                 ? (space._id as any).toString()
//                 : (space._id as string);

//             return (
//               <ParkingMarker
//                 key={key}
//                 space={space}
//                 latitude={space.location.coordinates[1]}
//                 longitude={space.location.coordinates[0]}
//                 onClick={() => handleMarkerClick(space)} // click still works (fetches route)
//                 onMouseEnter={() => handleMarkerHover(space)} // hover opens popup
//                 onMouseLeave={() => setSelectedSpace(null)} // leave closes popup
//                 color="green"
//                 icon={FaParking}
//               />
//             );
//           })}

//           {/* Optional route source/layer */}
//           {/* {routeSourceData && (
//             <Source id="route" type="geojson" data={routeSourceData}>
//               <Layer {...routeLayer} />
//             </Source>
//           )} */}

//           {/* Searched Location Marker */}
//           {searchedLocation && (
//             <ParkingMarker
//               latitude={searchedLocation.lat}
//               longitude={searchedLocation.lng}
//               color="blue"
//               icon={() => <MdLocationOn style={{ fontSize: '30px', color: 'red' }} />}
//               isCurrentLocation={false}
//             />
//           )}

//           {/* ======= Popup INSIDE Map so Popup has Map context ======= */}
//           {selectedSpace && (
//             <ParkingPopup
//               space={selectedSpace}
//               onClose={() => setSelectedSpace(null)}
//               user={user ?? null}
//             />
//           )}
//           {/* ================================================================= */}
//         </Map>
//       </div>

//       {/* If you want the list on the side, uncomment below */}
//       {/* <ParkingSpaceList
//         spaces={parkingSpaces}
//         onSpaceSelect={(space) => {
//           setSelectedSpace(space);
//           setViewport({
//             ...viewport,
//             latitude: space.location.coordinates[1],
//             longitude: space.location.coordinates[0],
//           });
//         }}
//         searchRadius={searchRadius}
//         onRadiusChange={setSearchRadius}
//         filters={filters}
//         userLocation={searchedLocation || currentLocation}
//       /> */}
//     </div>
//   );
// }




// import React, { useEffect, useState, useCallback } from 'react';
// import Map, { Source, Layer } from 'react-map-gl';
// import { toast } from 'react-toastify';
// import { ParkingSpace } from '../types/parking';
// import LocationSearch from '../components/search/LocationSearch';
// import ParkingSpaceList from '../components/parking/ParkingSpaceList';
// import ParkingMarker from '../components/map/ParkingMarker';
// import ParkingPopup from '../components/map/ParkingPopup';
// import { useMapContext } from '../context/MapContext';
// import { parkingService } from '../services/parking.service';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { GeocodingResult } from '../utils/geocoding';
// import { MdLocationOn } from 'react-icons/md';
// import { FaParking, FaUserCircle } from 'react-icons/fa';
// import { MdGpsFixed } from 'react-icons/md';
// import { SearchBar } from './SearchBar';
// import { SearchOverlay } from './SearchOverlayProps';
// import FilterBox from './Filterbox';
// import { useNavigate } from 'react-router-dom';
// import LoadingScreen from './LoadingScreen';
// import logo from '../../public/Park_your_Vehicle_log.png';

// export default function Home() {
//   const { viewport, setViewport } = useMapContext();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
//   const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
//   const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [searchRadius, setSearchRadius] = useState(2000); // Reduced for better results
//   const [loading, setLoading] = useState(true);
//   const [routeData, setRouteData] = useState<any>(null);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [popupTimeout, setPopupTimeout] = useState<NodeJS.Timeout | null>(null);
//   const [isPopupHovered, setIsPopupHovered] = useState(false);
//   const [filters, setFilters] = useState({
//     amenities: {
//       covered: false,
//       security: false,
//       charging: false,
//       cctv: false,
//       wheelchair: false,
//     },
//     priceRange: [0, 500],
//   });

//   // Debounced popup close function
//   const debouncedClosePopup = useCallback(() => {
//     if (popupTimeout) {
//       clearTimeout(popupTimeout);
//     }
    
//     if (!isPopupHovered) {
//       const timeout = setTimeout(() => {
//         setSelectedSpace(null);
//       }, 300); // 300ms delay before closing
      
//       setPopupTimeout(timeout);
//     }
//   }, [popupTimeout, isPopupHovered]);

//   // Cleanup timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (popupTimeout) {
//         clearTimeout(popupTimeout);
//       }
//     };
//   }, [popupTimeout]);

//   useEffect(() => {
//     const getLocation = async () => {
//       try {
//         if ('permissions' in navigator) {
//           const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
//           if (permission.state === 'granted') {
//             getUserLocation();
//           } else if (permission.state === 'prompt') {
//             getUserLocation();
//           } else {
//             setDefaultLocation();
//           }
//         } else {
//           getUserLocation();
//         }
//       } catch (error) {
//         setDefaultLocation();
//       }
//     };

//     getLocation();
//   }, []);

//   const setDefaultLocation = () => {
//     // Default to a central location if geolocation fails
//     const defaultLat = 28.6139; // Delhi coordinates
//     const defaultLng = 77.2090;
//     setViewport({ 
//       ...viewport, 
//       latitude: defaultLat, 
//       longitude: defaultLng,
//       zoom: 12 // Better default zoom for city level
//     });
//     setCurrentLocation({ lat: defaultLat, lng: defaultLng });
//     fetchNearbyParkingSpaces(defaultLat, defaultLng);
//     setLoading(false);
//   };

//   const getUserLocation = () => {
//     if (!navigator.geolocation) {
//       setDefaultLocation();
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         setViewport({ 
//           ...viewport, 
//           latitude, 
//           longitude,
//           zoom: 14 // Zoom closer for current location
//         });
//         setCurrentLocation({ lat: latitude, lng: longitude });
//         fetchNearbyParkingSpaces(latitude, longitude);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('Location error:', error);
//         toast.error(
//           <div className="flex items-center justify-between">
//             <span>Could not get your location. Please enable location services.</span>
//             <button
//               onClick={() => {
//                 if (navigator.userAgent.includes('Chrome')) {
//                   window.open('chrome://settings/content/location', '_blank');
//                 } else if (navigator.userAgent.includes('Firefox')) {
//                   window.open('about:preferences#privacy', '_blank');
//                 } else {
//                   window.open('chrome://settings/content/location', '_blank');
//                 }
//               }}
//               className="bg-blue-600 text-white px-3 py-1 ml-2 rounded-lg hover:bg-blue-700 text-sm"
//             >
//               Enable Location
//             </button>
//           </div>,
//           { autoClose: false }
//         );
//         setDefaultLocation();
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 300000
//       }
//     );
//   };

//   const fetchNearbyParkingSpaces = async (lat: number, lng: number) => {
//     try {
//       setLoading(true);
//       const spaces = await parkingService.getNearbySpaces(lat, lng, searchRadius);
//       setParkingSpaces(spaces || []);
      
//       // Auto-zoom to fit markers if we have spaces
//       if (spaces && spaces.length > 0) {
//         setTimeout(() => {
//           setViewport(prev => ({
//             ...prev,
//             zoom: Math.min(prev.zoom ?? 12, 14) // Don't zoom too close automatically
//           }));
//         }, 500);
//       }
//     } catch (error) {
//       toast.error('Failed to fetch parking spaces.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkerClick = async (space: ParkingSpace) => {
//     setSelectedSpace(space);
//     if (popupTimeout) {
//       clearTimeout(popupTimeout);
//     }
    
//     setViewport((prev) => ({
//       ...prev,
//       latitude: space.location.coordinates[1],
//       longitude: space.location.coordinates[0],
//       zoom: Math.max(prev.zoom ?? 12, 15), // Zoom closer on click
//     }));

//     if (currentLocation) {
//       const { lat: originLat, lng: originLng } = currentLocation;
//       const [destLng, destLat] = space.location.coordinates;
//       await fetchRoute(originLat, originLng, destLat, destLng);
//     }
//   };

//   const handleMarkerHover = (space: ParkingSpace) => {
//     setSelectedSpace(space);
//     if (popupTimeout) {
//       clearTimeout(popupTimeout);
//     }
//   };

//   const handlePopupMouseEnter = () => {
//     setIsPopupHovered(true);
//     if (popupTimeout) {
//       clearTimeout(popupTimeout);
//     }
//   };

//   const handlePopupMouseLeave = () => {
//     setIsPopupHovered(false);
//     debouncedClosePopup();
//   };

//   const handleClosePopup = () => {
//     setSelectedSpace(null);
//     if (popupTimeout) {
//       clearTimeout(popupTimeout);
//     }
//   };

//   const fetchRoute = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
//     try {
//       const response = await axios.get(
//         `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
//         {
//           params: {
//             alternatives: false,
//             geometries: 'geojson',
//             overview: 'full',
//             steps: true,
//             access_token: 'pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A',
//           },
//         }
//       );
//       setRouteData(response.data.routes[0]);
//     } catch (error) {
//       console.error('Route fetch error:', error);
//     }
//   };

//   const handleGoToCurrentLocation = () => {
//     if (currentLocation) {
//       setViewport({
//         ...viewport,
//         latitude: currentLocation.lat,
//         longitude: currentLocation.lng,
//         zoom: 15,
//       });
//       fetchNearbyParkingSpaces(currentLocation.lat, currentLocation.lng);
//     } else {
//       toast.info('Current location not available.');
//     }
//   };

//   const routeLayer = {
//     id: 'route',
//     type: 'line',
//     source: 'route',
//     layout: { 'line-cap': 'round', 'line-join': 'round' },
//     paint: { 'line-color': '#3887be', 'line-width': 5 },
//   };

//   const routeSourceData = routeData
//     ? {
//         type: 'Feature',
//         geometry: routeData.geometry,
//       }
//     : null;

//   const handleLocationSelect = async (result: GeocodingResult) => {
//     setSearchedLocation({ lat: result.latitude, lng: result.longitude });
//     setViewport({ 
//       ...viewport, 
//       longitude: result.longitude, 
//       latitude: result.latitude,
//       zoom: 13 
//     });

//     try {
//       const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, searchRadius);
//       setParkingSpaces(spaces || []);
//       if (!spaces || spaces.length === 0) {
//         toast.info('No nearby parking spaces available at the selected location.');
//       }
//     } catch (error) {
//       toast.error('Failed to fetch parking spaces for the selected location.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-[calc(100vh-64px)] flex items-center justify-center">
//         <LoadingScreen />
//       </div>
//     );
//   }

//   return (
//     <div className="h-[calc(100vh-64px)] relative">
//       <div className="absolute top-4 left-4 right-4 z-10">
//         <SearchBar onOpen={() => setIsSearchOpen(true)} />
//       </div>

//       <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

//       {/* Current Location Button */}
//       <div className="absolute bottom-24 right-4 z-10">
//         <button
//           onClick={handleGoToCurrentLocation}
//           className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
//           title="Go to current location"
//         >
//           <MdGpsFixed className="text-2xl text-blue-600" />
//         </button>
//       </div>

//       <div className="relative h-full">
//         <Map
//           {...viewport}
//           onMove={(evt) => setViewport(evt.viewState)}
//           mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
//           style={{ width: '100%', height: '100%' }}
//           mapStyle="mapbox://styles/mapbox/streets-v11"
//         >
//           {/* Current Location Marker */}
//           {currentLocation && (
//             <ParkingMarker
//               latitude={currentLocation.lat}
//               longitude={currentLocation.lng}
//               color="#3b82f6"
//               isCurrentLocation={true}
//               icon={FaUserCircle}
//             />
//           )}

//           {/* Parking Spaces Markers */}
//           {parkingSpaces.map((space) => {
//             const key = typeof space._id === 'object' && (space._id as any).toString
//               ? (space._id as any).toString()
//               : (space._id as string);

//             return (
//               <ParkingMarker
//                 key={key}
//                 space={space}
//                 latitude={space.location.coordinates[1]}
//                 longitude={space.location.coordinates[0]}
//                 onClick={() => handleMarkerClick(space)}
//                 onMouseEnter={() => handleMarkerHover(space)}
//                 onMouseLeave={debouncedClosePopup}
//                 color="#10b981"
//                 icon={FaParking}
//               />
//             );
//           })}

//           {/* Route Visualization */}
//           {routeSourceData && (
//             <Source id="route" type="geojson" data={routeSourceData}>
//               <Layer {...routeLayer} />
//             </Source>
//           )}

//           {/* Searched Location Marker */}
//           {searchedLocation && (
//             <ParkingMarker
//               latitude={searchedLocation.lat}
//               longitude={searchedLocation.lng}
//               color="#ef4444"
//               icon={() => <MdLocationOn style={{ fontSize: '28px', color: '#ef4444' }} />}
//               isCurrentLocation={false}
//             />
//           )}

//           {/* Parking Popup */}
//           {selectedSpace && (
//             <ParkingPopup
//               space={selectedSpace}
//               onClose={handleClosePopup}
//               onMouseEnter={handlePopupMouseEnter}
//               onMouseLeave={handlePopupMouseLeave}
//               user={user ?? null}
//             />
//           )}
//         </Map>
//       </div>

//       {/* Parking List Sidebar */}
//       <div className="absolute top-20 left-4 bottom-4 w-80 z-10 bg-white rounded-lg shadow-xl overflow-hidden">
//         <div className="p-4 border-b">
//           <h2 className="text-lg font-semibold text-gray-800">
//             Nearby Parking ({parkingSpaces.length})
//           </h2>
//           <div className="flex items-center mt-2 text-sm text-gray-600">
//             <MdLocationOn className="text-red-500 mr-1" />
//             <span>Radius: {searchRadius/1000}km</span>
//           </div>
//         </div>
        
//         <ParkingSpaceList
//           spaces={parkingSpaces}
//           onSpaceSelect={(space) => {
//             handleMarkerClick(space);
//           }}
//           searchRadius={searchRadius}
//           onRadiusChange={setSearchRadius}
//           filters={filters}
//           userLocation={searchedLocation || currentLocation}
//         />
//       </div>
//     </div>
//   );
// }




import React, { useEffect, useState, useCallback } from 'react';
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
import { MdLocationOn, MdFilterList, MdGpsFixed } from 'react-icons/md';
// import { FaParking, FaUserCircle, FaUmbrella, FaShield, FaBolt, FaWheelchair, FaVideo } from 'react-icons/fa';
import { FaParking, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella } from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import { SearchOverlay } from './SearchOverlayProps';
import FilterBox from './Filterbox';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';
import logo from '../../public/Park_your_Vehicle_log.png';

export default function Home() {
  const { viewport, setViewport } = useMapContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<ParkingSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [popupTimeout, setPopupTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    amenities: {
      covered: false,
      security: false,
      charging: false,
      cctv: false,
      wheelchair: false,
    },
    priceRange: [0, 500],
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

  // Apply filters whenever parkingSpaces or filters change
  useEffect(() => {
    if (parkingSpaces.length === 0) {
      setFilteredSpaces([]);
      return;
    }

    const filtered = parkingSpaces.filter(space => {
      // Price filter
      const price = space.pricePerHour ?? space.price ?? 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Amenities filter - only apply if at least one amenity filter is active
      const activeAmenityFilters = Object.entries(filters.amenities)
        .filter(([_, isActive]) => isActive)
        .map(([amenity]) => amenity);

      if (activeAmenityFilters.length > 0) {
        const spaceAmenities = space.amenities || [];
        const spaceAmenitiesLower = spaceAmenities.map(amenity => amenity.toLowerCase());
        
        // Check if space has all selected amenities
        const hasAllSelectedAmenities = activeAmenityFilters.every(amenityFilter => 
          spaceAmenitiesLower.some(spaceAmenity => 
            spaceAmenity.includes(amenityFilter.toLowerCase())
          )
        );
        
        if (!hasAllSelectedAmenities) {
          return false;
        }
      }

      return true;
    });

    setFilteredSpaces(filtered);
  }, [parkingSpaces, filters]);

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
      const spaces = await parkingService.getNearbySpaces(lat, lng, searchRadius);
      setParkingSpaces(spaces || []);
      
      if (spaces && spaces.length > 0) {
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
      priceRange: [min, max]
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
      priceRange: [0, 500],
    });
  };

  const getActiveFilterCount = () => {
    const activeAmenities = Object.values(filters.amenities).filter(Boolean).length;
    const isPriceFiltered = filters.priceRange[0] > 0 || filters.priceRange[1] < 500;
    return activeAmenities + (isPriceFiltered ? 1 : 0);
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

  const handleLocationSelect = async (result: GeocodingResult) => {
    setSearchedLocation({ lat: result.latitude, lng: result.longitude });
    setViewport({ 
      ...viewport, 
      longitude: result.longitude, 
      latitude: result.latitude,
      zoom: 13 
    });

    try {
      const spaces = await parkingService.getNearbySpaces(result.latitude, result.longitude, searchRadius);
      setParkingSpaces(spaces || []);
      if (!spaces || spaces.length === 0) {
        toast.info('No nearby parking spaces available at the selected location.');
      }
    } catch (error) {
      toast.error('Failed to fetch parking spaces for the selected location.');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar onOpen={() => setIsSearchOpen(true)} />
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Filters Button */}
      <div className="absolute top-20 right-4 z-10">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 flex items-center gap-2"
          title="Filter parking spaces"
        >
          <MdFilterList className="text-xl text-blue-600" />
          <span className="font-medium">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-28 right-4 z-10 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Filter Parking Spaces</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="p-4 border-b">
            <h4 className="font-medium text-gray-700 mb-3">Price Range (₹/hr)</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">₹{filters.priceRange[0]}</span>
              <span className="text-sm text-gray-600">₹{filters.priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceRangeChange(filters.priceRange[0], parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-3">Amenities</h4>
            <div className="space-y-2">
              {amenityFilters.map((amenity) => {
                const IconComponent = amenity.icon;
                const isActive = filters.amenities[amenity.id as keyof typeof filters.amenities];
                
                return (
                  <button
                    key={amenity.id}
                    onClick={() => handleFilterToggle(amenity.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <IconComponent className="text-lg" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{amenity.label}</div>
                      <div className="text-xs text-gray-500">{amenity.description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isActive && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="text-sm text-gray-600">
              Showing {filteredSpaces.length} of {parkingSpaces.length} spaces
            </div>
          </div>
        </div>
      )}

      {/* Current Location Button */}
      <div className="absolute bottom-24 right-4 z-10">
        <button
          onClick={handleGoToCurrentLocation}
          className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
          title="Go to current location"
        >
          <MdGpsFixed className="text-2xl text-blue-600" />
        </button>
      </div>

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

          {/* Parking Spaces Markers - Use filteredSpaces instead of parkingSpaces */}
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
      <div className="absolute top-20 left-4 bottom-4 w-80 z-10 bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Nearby Parking ({filteredSpaces.length})
            {filteredSpaces.length !== parkingSpaces.length && (
              <span className="text-sm text-gray-500 ml-1">
                (of {parkingSpaces.length})
              </span>
            )}
          </h2>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <MdLocationOn className="text-red-500 mr-1" />
            <span>Radius: {searchRadius/1000}km</span>
          </div>
        </div>
        
        <ParkingSpaceList
          spaces={filteredSpaces}
          onSpaceSelect={(space) => {
            handleMarkerClick(space);
          }}
          searchRadius={searchRadius}
          onRadiusChange={setSearchRadius}
          filters={filters}
          userLocation={searchedLocation || currentLocation}
        />
      </div>
    </div>
  );
}