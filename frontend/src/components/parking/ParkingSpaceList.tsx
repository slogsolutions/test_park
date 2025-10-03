// src/components/parking/ParkingSpaceList.tsx
import React, { useMemo } from 'react';
import { ParkingSpace } from '../../types/parking';
import { FaStar, FaMapMarkerAlt, FaClock, FaShieldAlt, FaBolt, FaWheelchair, FaVideo, FaUmbrella, FaCar, FaSearch, FaTag, FaFire, FaRocket } from 'react-icons/fa';

interface ParkingSpaceListProps {
  spaces: ParkingSpace[];
  onSpaceSelect: (space: ParkingSpace) => void;
  userLocation?: { lat: number; lng: number } | null;
  filters: {
    amenities: { [key: string]: boolean };
    priceRange: [number, number];
    isPriceFilterActive?: boolean;
  };
}

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getAmenityIcon = (amenity: string) => {
  const amenityLower = amenity.toLowerCase();
  const amenityIcons: { [key: string]: React.ElementType } = {
    security: FaShieldAlt,
    cctv: FaVideo,
    surveillance: FaVideo,
    camera: FaVideo,
    charging: FaBolt,
    electric: FaBolt,
    wheelchair: FaWheelchair,
    accessible: FaWheelchair,
    covered: FaUmbrella,
    roof: FaUmbrella,
    indoor: FaUmbrella,
    '24/7': FaClock,
  };

  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (amenityLower.includes(key)) {
      return icon;
    }
  }

  return FaCar;
};

const formatINR = (value: number, showCents = false) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);

const computePriceMeta = (space: any) => {
  const baseRaw = space?.priceParking ?? space?.price ?? 0;
  const base = Number(baseRaw) || 0;
  let rawDiscount = space?.discount ?? space?.discountPercent ?? space?.discount_percentage ?? 0;

  if (typeof rawDiscount === 'string') {
    rawDiscount = rawDiscount.replace?.('%', '') ?? rawDiscount;
  }

  if (typeof rawDiscount === 'object' && rawDiscount !== null) {
    rawDiscount = rawDiscount.percent ?? rawDiscount.value ?? rawDiscount.amount ?? 0;
  }

  const discountNum = Number(rawDiscount);
  const discountPercent = Number.isFinite(discountNum) ? Math.max(0, Math.min(100, discountNum)) : 0;
  const discountedPrice = +(base * (1 - discountPercent / 100)).toFixed(2);
  const hasDiscount = discountPercent > 0 && discountedPrice < base;

  return {
    basePrice: +base.toFixed(2),
    discountPercent,
    discountedPrice,
    hasDiscount,
  };
};

const getDiscountBadgeStyle = (discountPercent: number) => {
  if (discountPercent >= 50) {
    return {
      gradient: 'from-red-500 to-pink-600',
      shadow: 'shadow-lg shadow-red-500/25',
      icon: FaFire,
      text: 'text-white',
      pulse: 'animate-pulse'
    };
  } else if (discountPercent >= 30) {
    return {
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-lg shadow-orange-500/25',
      icon: FaRocket,
      text: 'text-white',
      pulse: ''
    };
  } else if (discountPercent >= 15) {
    return {
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-lg shadow-green-500/25',
      icon: FaTag,
      text: 'text-white',
      pulse: ''
    };
  } else {
    return {
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-md shadow-blue-500/20',
      icon: FaTag,
      text: 'text-white',
      pulse: ''
    };
  }
};

export default function ParkingSpaceList({
  spaces,
  onSpaceSelect,
  userLocation = null,
  filters,
}: ParkingSpaceListProps) {
  // defensive default
  const isPriceActive = !!filters.isPriceFilterActive;

  // Create filtered, distance-sorted, top-10 list using useMemo for perf
  const results = useMemo(() => {
    if (!Array.isArray(spaces)) return [];

    const out: any[] = [];

    for (const raw of spaces) {
      const space: any = { ...raw };

      // compute distance if userLocation available
      if (userLocation && userLocation.lat != null && userLocation.lng != null) {
        try {
          space.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            space.location.coordinates[1],
            space.location.coordinates[0]
          );
        } catch {
          space.distance = Number.POSITIVE_INFINITY;
        }
      } else {
        // no user location => deprioritize by setting distance large
        space.distance = Number.POSITIVE_INFINITY;
      }

      // Amenity filters
      let amenityOk = true;
      for (const [key, value] of Object.entries(filters.amenities)) {
        if (value) {
          if (!space.amenities || !space.amenities.some((amen: string) => amen.toLowerCase().includes(key.toLowerCase()))) {
            amenityOk = false;
            break;
          }
        }
      }
      if (!amenityOk) continue;

      // Price filter only when explicitly active
      if (isPriceActive) {
        const price = Number(space.priceParking ?? space.price ?? 0);
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
          continue;
        }
      }

      out.push(space);
    }

    // Sort by distance asc (spaces without location will go to end)
    out.sort((a, b) => {
      const da = typeof a.distance === 'number' ? a.distance : Number.POSITIVE_INFINITY;
      const db = typeof b.distance === 'number' ? b.distance : Number.POSITIVE_INFINITY;
      return da - db;
    });

    // Always return up to 10
    return out.slice(0, 10);
  }, [spaces, filters, userLocation, isPriceActive]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-white/30">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full flex items-center justify-center mb-3 shadow-lg">
          <FaSearch className="text-2xl text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-1">No parking spaces found</h3>
        <p className="text-gray-500 text-sm max-w-xs">Try removing filters or move the map/search to another area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {results.map((space: any) => {
        const address: any = space.address || {};
        const amenities = Array.isArray(space.amenities) ? space.amenities : [];
        const rating = typeof space.rating === 'number' ? space.rating : 0;
        const availableSpots = space.availableSpots ?? 0;

        const priceMeta = (space as any).__price ?? computePriceMeta(space);
        const basePrice = priceMeta.basePrice;
        const discountedPrice = priceMeta.discountedPrice;
        const hasDiscount = priceMeta.hasDiscount;
        const discountPercent = priceMeta.discountPercent;

        const discountStyle = hasDiscount ? getDiscountBadgeStyle(discountPercent) : null;
        const DiscountIcon = discountStyle?.icon;

        return (
          <div
            key={space._id}
            onClick={() => onSpaceSelect(space)}
            className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 border border-white/30 overflow-hidden hover:border-blue-300 relative"
          >
            {hasDiscount && discountPercent >= 30 && (
              <div className={`absolute -top-2 -right-2 z-10 ${discountStyle?.pulse}`}>
                <div className={`bg-gradient-to-r ${discountStyle?.gradient} ${discountStyle?.shadow} text-white px-3 py-1 rounded-lg font-bold text-xs transform rotate-6 flex items-center gap-1`}>
                  {DiscountIcon && <DiscountIcon className="text-xs" />}
                  {discountPercent}% OFF
                </div>
                <div className={`absolute bottom-0 right-3 w-2 h-2 bg-gradient-to-r ${discountStyle?.gradient} transform rotate-45 translate-y-1`}></div>
              </div>
            )}

            <div className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight truncate mb-1">
                    {space.title || 'Premium Parking Space'}
                  </h3>
                  <div className="flex items-center text-gray-600 text-xs">
                    <FaMapMarkerAlt className="text-red-500 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {address.street || 'Unknown Street'}, {address.city || 'Unknown City'}
                    </span>
                  </div>
                </div>

                <div className="text-right ml-2 flex-shrink-0">
                  {hasDiscount ? (
                    <div className="flex flex-col items-end">
                      {discountPercent < 30 && (
                        <div className={`mb-1 bg-gradient-to-r ${discountStyle?.gradient} ${discountStyle?.shadow} text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1`}>
                          {DiscountIcon && <DiscountIcon className="text-xs" />}
                          {discountPercent}% OFF
                        </div>
                      )}
                      <div className="text-xs text-gray-400 line-through mb-1">
                        {formatINR(basePrice, false)}
                      </div>
                      <div className="text-lg font-bold text-green-700 mb-1">
                        {formatINR(discountedPrice, true)}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                        Save {formatINR(basePrice - discountedPrice, true)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-500/25">
                      <div className="leading-none">{formatINR(basePrice, false)}</div>
                      <div className="text-xs opacity-90 mt-1">/hour</div>
                    </div>
                  )}

                  {rating > 0 && (
                    <div className="flex items-center justify-end mt-2">
                      <div className="bg-yellow-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span className="text-xs font-bold text-gray-800">{rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-semibold">
                  {availableSpots} spot{availableSpots !== 1 ? 's' : ''} available
                </div>
                <div className="text-xs text-gray-500">
                  {typeof space.distance === 'number' && isFinite(space.distance) ? `${space.distance.toFixed(1)} km` : ''}
                </div>
              </div>

              {amenities.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {amenities.slice(0, 2).map((amenity: string, idx: number) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                          title={amenity}
                        >
                          <AmenityIcon className="mr-1 text-xs" />
                          {amenity.length > 12 ? amenity.substring(0, 10) + '...' : amenity}
                        </span>
                      );
                    })}
                    {amenities.length > 2 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        +{amenities.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                    <FaClock className="mr-1 text-blue-500 text-xs" />
                    {space.available24_7 ? '24/7 Available' : 'Limited hours'}
                  </span>
                </div>

                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpaceSelect(space);
                  }}
                >
                  {hasDiscount ? (
                    <>
                      <FaTag className="text-xs" />
                      Grab Deal
                    </>
                  ) : (
                    'View Details'
                  )}
                </button>
              </div>
            </div>

            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-300 rounded-xl pointer-events-none transition-all duration-300"></div>
          </div>
        );
      })}

      <style jsx>{`
        .max-h-64::-webkit-scrollbar {
          width: 6px;
        }
        .max-h-64::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .max-h-64::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .max-h-64::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
}
