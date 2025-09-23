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

  // helper to display file names
  const renderFileNames = () => {
    if (!formData.photos || formData.photos.length === 0) return <span className="italic text-sm text-gray-500">No photos chosen</span>;
    return Array.from(formData.photos).map((f, i) => <div key={i} className="text-sm text-gray-700">{(f as File).name}</div>);
  };

  return (
    // PAGE WRAPPER for full-viewport bg/text colors in both themes
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Register Your Parking Space</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Sarthak's Parking Near Main St."
                  />
                </div>

                {/* Parking Space Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    Parking Space Price
                    <span className="ml-2 relative group">
                      <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                      <span className="absolute bottom-6 left-0 w-56 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        Default set for 2 hours. You can change it as required.
                      </span>
                    </span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={formData.priceParking}
                    onChange={(e) =>
                      setFormData({ ...formData, priceParking: parseFloat(e.target.value || '0') })
                    }
                    placeholder="Enter numeric value"
                  />
                </div>

                {/* Slots */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Slots</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={formData.availableSpots}
                    onChange={(e) =>
                      setFormData({ ...formData, availableSpots: parseInt(e.target.value || '0') })
                    }
                    placeholder="Number of parking slots"
                  />
                </div>

                {/* Price per Hour */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Price per Hour</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerHour: parseFloat(e.target.value || '0') })
                    }
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your parking space, access details and any rules..."
                />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-3">
                  {amenitiesOptions.map((amenity) => {
                    const checked = formData.amenities.includes(amenity);
                    return (
                      <label
                        key={amenity}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          checked
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        } cursor-pointer`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={(e) => {
                            const newAmenities = e.target.checked
                              ? [...formData.amenities, amenity]
                              : formData.amenities.filter((a) => a !== amenity);
                            setFormData({ ...formData, amenities: newAmenities });
                          }}
                        />
                        <span className="capitalize text-sm">{amenity}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Photos</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer shadow-sm hover:shadow-md">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, photos: e.target.files })}
                    />
                    <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0016.586 6L13 2.414A2 2 0 0011.586 2H4z"/></svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose Files</span>
                  </label>

                  <div className="flex-1">
                    {renderFileNames()}
                  </div>
                </div>
              </div>

              {/* Availability UI (uses your existing functions) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Availability (optional)</label>
                  <button type="button" onClick={addAvailabilitySlot} className="text-sm text-red-600 hover:underline">Add slot</button>
                </div>

                <div className="space-y-3">
                  {formData.availability.length === 0 && (
                    <div className="text-sm text-gray-500">No availability configured. Add dates and times if you want to predefine slots.</div>
                  )}

                  {formData.availability.map((avail, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                      <div className="mb-2">
                        <label className="text-xs text-gray-600 dark:text-gray-300">Date</label>
                        <input
                          type="date"
                          value={avail.date}
                          onChange={(e) => handleAvailabilityChange(i, 'date', e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                      </div>

                      {avail.slots.map((slot, si) => (
                        <div key={si} className="grid grid-cols-2 gap-2 items-end mb-2">
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-300">Start time</label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleAvailabilityChange(i, `startTime-${si}`, e.target.value)}
                              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 dark:text-gray-300">End time</label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleAvailabilityChange(i, `endTime-${si}`, e.target.value)}
                              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>

          {/* Right: Map + address + tips */}
          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="h-64 rounded-lg overflow-hidden mb-3 bg-gray-50 dark:bg-gray-800">
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

              <div className="mb-4">
                <LocationSearchBox
                  onLocationSelect={handleLocationSelect}
                  onGoToCurrentLocation={handleGoToCurrentLocation}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">City</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">State</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToCurrentLocation}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow"
                >
                  <MapPin className="h-4 w-4" />
                  Use current location
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
              <strong className="block mb-2 text-gray-800 dark:text-gray-200">Tips</strong>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use an accurate street address for better search results.</li>
                <li>Add clear photos showing entrance & parking layout.</li>
                <li>Set price and slots correctly to reduce cancellations.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
