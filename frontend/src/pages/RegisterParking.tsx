import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Info, MapPin, Star, Upload, Clock, Calendar, Shield, Zap, Eye, Accessibility } from 'lucide-react';
import Map, { Marker } from 'react-map-gl';
import { parkingService } from '../services/parking.service';
import { useMapContext } from '../context/MapContext';
import LocationSearchBox from '../components/search/LocationSearch';
import { reverseGeocode } from '../utils/geocoding';

interface ParkingFormData {
  title: string;
  description: string;
  pricePerHour: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  priceParking: number;
  availableSpots: number;
  country: string;
  amenities: string[];
  photos: FileList | null;
  availability: { date: string; slots: { startTime: string; endTime: string; isBooked: boolean }[] };
  discount: number;
}

const amenitiesOptions = [
  { id: 'covered', label: 'Covered', icon: Shield, color: 'text-blue-600' },
  { id: 'security', label: '24/7 Security', icon: Shield, color: 'text-green-600' },
  { id: 'charging', label: 'EV Charging', icon: Zap, color: 'text-purple-600' },
  { id: 'cctv', label: 'CCTV', icon: Eye, color: 'text-red-600' },
  { id: 'wheelchair', label: 'Wheelchair Access', icon: Accessibility, color: 'text-orange-600' }
];

export default function RegisterParking() {
  const navigate = useNavigate();
  const { viewport, setViewport } = useMapContext();

  const [markerPosition, setMarkerPosition] = useState({
    latitude: viewport?.latitude ?? 37.7749,
    longitude: viewport?.longitude ?? -122.4194,
  });

  const [formData, setFormData] = useState<ParkingFormData>({
    title: '',
    description: '',
    pricePerHour: 0,
    priceParking: 0,
    availableSpots: 0,
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    amenities: [],
    photos: null,
    availability: { date: '', slots: [{ startTime: '', endTime: '', isBooked: false }] },
    discount: 0,
  });

  // Calculate discounted price
  const discountedPrice = formData.priceParking * (1 - formData.discount / 100);
  const savingsAmount = formData.priceParking - discountedPrice;

  const addAvailabilitySlot = () => {
    const newSlot = { startTime: '', endTime: '', isBooked: false };
    setFormData({ 
      ...formData, 
      availability: {
        ...formData.availability,
        slots: [...formData.availability.slots, newSlot]
      }
    });
  };

  const handleAvailabilityChange = (slotIndex: number, field: string, value: string) => {
    const updatedSlots = [...formData.availability.slots];
    updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value };
    
    setFormData({ 
      ...formData, 
      availability: { ...formData.availability, slots: updatedSlots }
    });
  };

  const extractLngLat = (obj: any) => {
    const longitude = obj?.longitude ?? obj?.lng ?? obj?.lon ?? obj?.long ?? (Array.isArray(obj) ? obj[0] : undefined);
    const latitude = obj?.latitude ?? obj?.lat ?? obj?.latitude ?? (Array.isArray(obj) ? obj[1] : undefined);
    return { 
      longitude: longitude !== undefined ? Number(longitude) : undefined, 
      latitude: latitude !== undefined ? Number(latitude) : undefined 
    };
  };

  const extractFromMapEvent = (evt: any) => {
    const lngLat = evt?.lngLat ?? evt?.point ?? null;
    if (Array.isArray(evt?.lngLat)) {
      return { longitude: Number(evt.lngLat[0]), latitude: Number(evt.lngLat[1]) };
    }
    if (evt?.lngLat && typeof evt.lngLat === 'object') {
      return { longitude: Number(evt.lngLat.lng ?? evt.lngLat[0]), latitude: Number(evt.lngLat.lat ?? evt.lngLat[1]) };
    }
    return { longitude: Number(evt.lng ?? evt.longitude), latitude: Number(evt.lat ?? evt.latitude) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... existing submit logic (unchanged)
    try {
      const address = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };

      const formattedAvailability = [{
        date: formData.availability.date,
        slots: formData.availability.slots.map((slot) => ({
          startTime: `${formData.availability.date}T${slot.startTime}:00`,
          endTime: `${formData.availability.date}T${slot.endTime}:00`,
          isBooked: slot.isBooked,
        })),
      }];

      const { longitude: rawLon, latitude: rawLat } = extractLngLat(markerPosition);

      if (rawLon === undefined || rawLat === undefined || isNaN(Number(rawLon)) || isNaN(Number(rawLat))) {
        toast.error('Please pick a valid location on the map before submitting.');
        return;
      }

      const lon = Number(rawLon);
      const lat = Number(rawLat);

      if (!formData.photos || formData.photos.length === 0) {
        const payload = {
          title: formData.title,
          description: formData.description,
          pricePerHour: Number(formData.pricePerHour),
          priceParking: Number(formData.priceParking),
          availableSpots: Number(formData.availableSpots),
          address,
          availability: formattedAvailability,
          amenities: formData.amenities,
          location: { type: 'Point', coordinates: [lon, lat] },
          discount: Number(formData.discount),
        };

        await parkingService.registerSpaceJSON(payload);
        toast.success('Parking space registered successfully!');
        navigate('/');
        return;
      }

      const data = new FormData();
      data.append('address', JSON.stringify(address));
      data.append('availability', JSON.stringify(formattedAvailability));
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('pricePerHour', String(formData.pricePerHour));
      data.append('priceParking', String(formData.priceParking));
      data.append('availableSpots', String(formData.availableSpots));
      data.set('amenities', JSON.stringify(formData.amenities));
      Array.from(formData.photos).forEach((file) => data.append('photos', file));
      data.set('discount', String(formData.discount));
      
      const locationObj = { type: 'Point', coordinates: [lon, lat] };
      data.set('location', JSON.stringify(locationObj));
      data.set('lng', String(lon));
      data.set('lat', String(lat));

      await parkingService.registerSpace(data);
      toast.success('Parking space registered successfully!');
      navigate('/');
    } catch (err: any) {
      console.error('Error registering parking space:', err);
      toast.error(`Failed to register parking space: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLocationSelect = (location: any) => {
    const { longitude, latitude } = extractLngLat(location);
    setMarkerPosition({
      latitude: latitude ?? markerPosition.latitude,
      longitude: longitude ?? markerPosition.longitude,
    });
    setFormData({
      ...formData,
      street: location.street || '',
      city: location.city || '',
      state: location.state || '',
      zipCode: location.zipCode || '',
      country: location.country || '',
    });
    setViewport({
      ...viewport,
      latitude: latitude ?? viewport.latitude,
      longitude: longitude ?? viewport.longitude,
      zoom: 14,
    });
  };

  const handleGoToCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ latitude, longitude });
        setViewport({ ...viewport, latitude, longitude, zoom: 14 });

        try {
          const loc = await reverseGeocode(latitude, longitude);
          setFormData((prev) => ({
            ...prev,
            street: loc.street || '',
            city: loc.city || '',
            state: loc.state || '',
            zipCode: loc.zipCode || '',
            country: loc.country || '',
          }));
        } catch {
          toast.info('Location set; address lookup failed — edit fields manually if needed.');
        }
      },
      () => {
        toast.error('Failed to access your current location.');
      }
    );
  };

  const renderFileNames = () => {
    if (!formData.photos || formData.photos.length === 0) 
      return <span className="italic text-sm text-gray-500">No photos chosen</span>;
    return Array.from(formData.photos).map((f, i) => 
      <div key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{(f as File).name}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
            Register Your Parking Space
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-3 max-w-2xl mx-auto">
            List your parking space and start earning today. Fill in the details below to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form Section */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Star className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tell us about your parking space</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Parking Space Title
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Secure Downtown Parking"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available Spots
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.availableSpots}
                      onChange={(e) => setFormData({ ...formData, availableSpots: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your parking space features, access instructions, and any rules..."
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pricing Details</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Set your rates and discounts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Price per Hour (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.priceParking}
                      onChange={(e) => setFormData({ ...formData, priceParking: parseFloat(e.target.value || '0') })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Late Fee per Hour (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.pricePerHour}
                      onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value || '0') })}
                      placeholder="Additional charge for overtime"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      value={formData.discount}
                      onChange={(e) => {
                        let v = parseFloat(e.target.value || '0');
                        if (v < 0) v = 0;
                        if (v > 100) v = 100;
                        setFormData({ ...formData, discount: v });
                      }}
                    />
                  </div>
                </div>

                {/* Price Display */}
                {formData.discount > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Original Price:</span>
                        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{formData.priceParking.toFixed(2)}/hour
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          {formData.discount}% OFF
                        </span>
                        <div className="text-lg font-bold text-green-700 dark:text-green-300">
                          ₹{discountedPrice.toFixed(2)}/hour
                        </div>
                      </div>
                      {/* <div className="text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">You save:</span>
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          ₹{savingsAmount.toFixed(2)}/hour
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Amenities</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select available features</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {amenitiesOptions.map((amenity) => {
                    const IconComponent = amenity.icon;
                    const checked = formData.amenities.includes(amenity.id);
                    return (
                      <label
                        key={amenity.id}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          checked
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="absolute opacity-0"
                          checked={checked}
                          onChange={(e) => {
                            const newAmenities = e.target.checked
                              ? [...formData.amenities, amenity.id]
                              : formData.amenities.filter((a) => a !== amenity.id);
                            setFormData({ ...formData, amenities: newAmenities });
                          }}
                        />
                        <IconComponent className={`h-8 w-8 mb-2 ${checked ? amenity.color : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium text-center ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {amenity.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Photos Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Photos</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload clear images of your parking space</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-red-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">Choose Files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, photos: e.target.files })}
                    />
                  </label>

                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      {renderFileNames()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Register Parking Space
                </button>
              </div>
            </form>
          </div>

          {/* Right: Map & Location Section */}
          <div className="space-y-6">
            {/* Map Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <MapPin className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Location</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pin your exact parking location</p>
                  </div>
                </div>

                <div className="h-80 rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-700">
                  <Map
                    {...viewport}
                    onMove={(evt) => setViewport(evt.viewState)}
                    onClick={async (evt: any) => {
                      const { longitude, latitude } = extractFromMapEvent(evt);
                      if (!isNaN(latitude) && !isNaN(longitude)) {
                        setMarkerPosition({ latitude, longitude });
                        try {
                          const loc = await reverseGeocode(latitude, longitude);
                          setFormData((prev) => ({
                            ...prev,
                            street: loc.street || '',
                            city: loc.city || '',
                            state: loc.state || '',
                            zipCode: loc.zipCode || '',
                            country: loc.country || '',
                          }));
                        } catch {
                          toast.info('Pinned location set; address lookup failed.');
                        }
                      }
                    }}
                    mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                  >
                    {!isNaN(markerPosition.latitude) && !isNaN(markerPosition.longitude) && (
                      <Marker
                        latitude={markerPosition.latitude}
                        longitude={markerPosition.longitude}
                        draggable
                        onDragEnd={async (evt: any) => {
                          const { longitude, latitude } = extractFromMapEvent(evt);
                          if (!isNaN(latitude) && !isNaN(longitude)) {
                            setMarkerPosition({ latitude, longitude });
                            try {
                              const loc = await reverseGeocode(latitude, longitude);
                              setFormData((prev) => ({
                                ...prev,
                                street: loc.street || '',
                                city: loc.city || '',
                                state: loc.state || '',
                                zipCode: loc.zipCode || '',
                                country: loc.country || '',
                              }));
                            } catch {
                              toast.info('Pinned location set; address lookup failed.');
                            }
                          }
                        }}
                      >
                        <div className="relative">
                          <div className="animate-ping absolute -inset-1 bg-red-400 rounded-full opacity-75"></div>
                          <MapPin className="h-8 w-8 text-red-600 relative" fill="currentColor" />
                        </div>
                      </Marker>
                    )}
                  </Map>
                </div>

                <LocationSearchBox
                  onLocationSelect={handleLocationSelect}
                  onGoToCurrentLocation={handleGoToCurrentLocation}
                />

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Street Address"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="ZIP Code"
                    />
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Pro Tips for Success
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Use high-quality photos showing entrance and parking layout</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Set competitive prices with occasional discounts to attract customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Be accurate about availability to maintain good ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Highlight unique amenities to stand out from competitors</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}