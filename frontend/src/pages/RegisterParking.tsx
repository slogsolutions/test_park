import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Info, MapPin } from 'lucide-react';
import Map, { Marker } from 'react-map-gl';
import { parkingService } from '../services/parking.service';
import { useMapContext } from '../context/MapContext';
import LocationSearchBox from '../components/search/LocationSearch';

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
  availability: { date: string; slots: { startTime: string; endTime: string; isBooked: boolean }[] }[];
}

const amenitiesOptions = ['covered', 'security', 'charging', 'cctv', 'wheelchair'];

export default function RegisterParking() {
  const navigate = useNavigate();
  const { viewport, setViewport } = useMapContext();

  const [markerPosition, setMarkerPosition] = useState({
    latitude: viewport.latitude || 37.7749,
    longitude: viewport.longitude || -122.4194,
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
    availability: [],
  });

  const addAvailabilitySlot = () => {
    const newAvailability = {
      date: '',
      slots: [{ startTime: '', endTime: '', isBooked: false }],
    };
    setFormData({ ...formData, availability: [...formData.availability, newAvailability] });
  };

  const handleAvailabilityChange = (index: number, field: string, value: any) => {
    const updatedAvailability = [...formData.availability];
    const [fieldName, slotIndex] = field.split('-');
    const slotIdx = parseInt(slotIndex, 10);

    if (fieldName === 'date') {
      updatedAvailability[index].date = value;
    } else if ((fieldName === 'startTime' || fieldName === 'endTime') && !isNaN(slotIdx)) {
      updatedAvailability[index].slots[slotIdx] = {
        ...updatedAvailability[index].slots[slotIdx],
        [fieldName]: value,
      };
    }

    setFormData({ ...formData, availability: updatedAvailability });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // Build address & availability
    const address = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
    };

    const formattedAvailability = formData.availability.map((availability) => ({
      date: availability.date,
      slots: availability.slots.map((slot) => ({
        startTime: `${availability.date}T${slot.startTime}:00`,
        endTime: `${availability.date}T${slot.endTime}:00`,
        isBooked: slot.isBooked,
      })),
    }));

    // If there are no photos, send JSON (cleanest)
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
        location: { type: 'Point', coordinates: [Number(markerPosition.longitude), Number(markerPosition.latitude)] },
      };

      console.log('Posting JSON payload to /api/parking:', payload);

      // Use parkingService JSON helper (see below) or call fetch directly
      await parkingService.registerSpaceJSON(payload);

      toast.success('Parking space registered successfully!');
      navigate('/');
      return;
    }

    // Otherwise (photos present) - send FormData
    const data = new FormData();
    data.append('address', JSON.stringify(address));
    data.append('availability', JSON.stringify(formattedAvailability));
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('pricePerHour', String(formData.pricePerHour));
    data.append('priceParking', String(formData.priceParking));
    data.append('availableSpots', String(formData.availableSpots));
    formData.amenities.forEach((a) => data.append('amenities', a));
    Array.from(formData.photos).forEach((file) => data.append('photos', file));

    // Append coordinates as array fields (common server expectation)
    data.append('location[coordinates][]', String(markerPosition.longitude));
    data.append('location[coordinates][]', String(markerPosition.latitude));
    data.append('location[type]', 'Point');

    // DEBUG: print entries
    for (const pair of data.entries()) console.log('FormData entry:', pair[0], pair[1]);

    await parkingService.registerSpace(data); // existing service that posts FormData
    toast.success('Parking space registered successfully!');
    navigate('/');
  } catch (err: any) {
    console.error('Error registering parking space:', err);
    console.error('Server response:', err.response?.data);
    toast.error(`Failed to register parking space: ${err.response?.data?.message || err.message}`);
  }
};



  const handleLocationSelect = (location: any) => {
    setMarkerPosition({
      latitude: location.latitude,
      longitude: location.longitude,
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
      latitude: location.latitude,
      longitude: location.longitude,
      zoom: 14,
    });
  };

  const handleGoToCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ latitude, longitude });
        setViewport({ ...viewport, latitude, longitude, zoom: 14 });
      },
      () => {
        toast.error('Failed to access your current location.');
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">Register Your Parking Space</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Price Parking */}
            <div>
              <label className="text-sm font-medium flex text-gray-700">
                Parking Space Price
                <span className="ml-2 relative group">
                  <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                  <span className="absolute bottom-5 left-2 w-48 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Default set for 2 hours. You can change it as required.
                  </span>
                </span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={formData.priceParking}
                onChange={(e) =>
                  setFormData({ ...formData, priceParking: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* Slots */}
            <div>
              <label className="text-sm font-medium flex text-gray-700">Slots</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={formData.availableSpots}
                onChange={(e) =>
                  setFormData({ ...formData, availableSpots: parseInt(e.target.value) })
                }
              />
            </div>

            {/* Price per hour */}
            <div>
              <label className="text-sm font-medium flex text-gray-700">Price per Hour</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })
                }
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Amenities</label>
              <div className="mt-2 space-y-2">
                {amenitiesOptions.map((amenity) => (
                  <label key={amenity} className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-500 focus:ring-red-500"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => {
                        const newAmenities = e.target.checked
                          ? [...formData.amenities, amenity]
                          : formData.amenities.filter((a) => a !== amenity);
                        setFormData({ ...formData, amenities: newAmenities });
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Photos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                onChange={(e) => setFormData({ ...formData, photos: e.target.files })}
              />
            </div>
          </div>

          {/* Right side: Map + address */}
          <div className="space-y-4">
            <div className="h-64 mb-4 rounded-lg overflow-hidden">
              <Map
                {...viewport}
                onMove={(evt) => setViewport(evt.viewState)}
                onClick={(evt: any) => {
                  const { lat, lng } = evt.lngLat || {};
                  if (!isNaN(lat) && !isNaN(lng)) {
                    setMarkerPosition({ latitude: lat, longitude: lng });
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
                    onDragEnd={(evt: any) => {
                      const { lat, lng } = evt.lngLat || {};
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setMarkerPosition({ latitude: lat, longitude: lng });
                      }
                    }}
                  >
                    <MapPin className="h-6 w-6 text-red-500" />
                  </Marker>
                )}
              </Map>
            </div>

            <div className="mb-4 w-50">
              <LocationSearchBox
                onLocationSelect={handleLocationSelect}
                onGoToCurrentLocation={handleGoToCurrentLocation}
              />
            </div>

            {/* Address fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
