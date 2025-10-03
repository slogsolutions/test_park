import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popup } from 'react-map-gl';
import { ParkingSpace } from '../../types/parking';
import { toast } from 'react-toastify';
import { FaStar, FaMapMarkerAlt, FaClock, FaShieldAlt, FaCar, FaBolt, FaWheelchair, FaVideo, FaUmbrella, FaChevronLeft, FaChevronRight, FaCheck, FaTimes } from 'react-icons/fa';

interface ParkingPopupProps {
  space: ParkingSpace;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  user: { id?: string; _id?: string; name?: string; isVerified?: boolean } | null;
}

export default function ParkingPopup({ space, onClose, onMouseEnter, onMouseLeave, user }: ParkingPopupProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const address: any = (space as any).address || {};
  const street = address.street || 'No street information';
  const city = address.city || 'No city information';
  const rating = (space as any).rating ?? 0;
  const amenities = (space as any).amenities || [];

  // currency formatter
  const fmt = (value: number, decimals = 2) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: decimals }).format(value);

  // compute discounted price meta (won't modify original object)
  const computeDiscountedPrice = (s: any) => {
    const base = Number(s.priceParking ?? s.pricePerHour ?? s.price ?? 0) || 0;
    const rawDiscount = s.discount ?? 0;
    const discount = Number.isFinite(Number(rawDiscount)) ? Number(rawDiscount) : 0;
    const clamped = Math.max(0, Math.min(100, discount));
    const discounted = +(base * (1 - clamped / 100)).toFixed(2);
    return {
      basePrice: +base.toFixed(2),
      discountPercent: clamped,
      discountedPrice: discounted,
      hasDiscount: clamped > 0 && discounted < base,
    };
  };

  // prefer precomputed __price (if Home attached it), otherwise compute
  const priceMeta = (space as any).__price ?? computeDiscountedPrice(space as any);
  const basePrice = priceMeta.basePrice;
  const discountedPrice = priceMeta.discountedPrice;
  const hasDiscount = priceMeta.hasDiscount;
  const discountPercent = priceMeta.discountPercent;

  // --- Photo handling: normalize to full URLs so <img src=...> always works ---
  // Accepts:
  // - space.photos as array of strings (either filenames like "abc.jpg" or full URLs),
  // - space.photos as a single string,
  // - array of objects with { filename } or { path }.
 // use the backend base URL set in .env (VITE_BASE_URL) or fallback to window.location.origin
const API_BASE = (import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') || window.location.origin);
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim(); // optional

const makeUrl = (p: any) => {
  if (!p) return null;
  if (typeof p === 'string') {
    // Already a full URL (including Cloudinary secure URLs)
    if (p.startsWith('http://') || p.startsWith('https://')) return p;

    // Server-relative path like '/uploads/...' -> prefix backend base URL
    if (p.startsWith('/')) return `${API_BASE}${p}`;

    // If the string looks like a Cloudinary public id / path (contains folder or 'aparkfinder' etc)
    // and we have CLOUD_NAME provided in frontend env, construct a Cloudinary URL:
    // e.g. 'aparkfinder/parking/abc.jpg' -> https://res.cloudinary.com/<cloud>/image/upload/aparkfinder/parking/abc.jpg
    // or 'aparkfinder/parking/abc' -> add no extension (Cloudinary serves it)
    if (CLOUD_NAME && p.includes('/')) {
      // Prevent accidentally turning filenames like 'myphoto.jpg' into cloud URLs unless DB actually stored folder paths.
      // Heuristic: if it contains folder-like segment (a slash), treat as cloud public id/path.
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${p}`;
    }

    // assume filename stored in DB -> /uploads/<filename>
    return `${API_BASE}/uploads/${p}`;
  }
  // if object from multer like { filename, path }
  if (typeof p === 'object') {
    if (p.url) return p.url;
    if (p.path && (p.path.startsWith('http://') || p.path.startsWith('https://'))) return p.path;
    if (p.path && p.path.startsWith('/')) return `${API_BASE}${p.path}`;
    if (p.filename) return `${API_BASE}/uploads/${p.filename}`;
  }
  return null;
};


  const rawPhotos = (space as any).photos;
  const images = Array.isArray(rawPhotos) && rawPhotos.length > 0
    ? rawPhotos.map(makeUrl).filter(Boolean)
    : rawPhotos
      ? [makeUrl(rawPhotos)].filter(Boolean)
      : [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
        ];

  // --- end photo handling ---

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.info('Please log in to book the parking space.');
      navigate('/login');
      return;
    }

    if (!user.isVerified) {
      toast.info('Your account is not verified. Please complete your verification to book.');
      return;
    }

    const sid = (space as any)._id?.toString() || (space as any)._id;
    const uid = (user as any)._id || (user as any).id;
    navigate('/vehicle-details', { state: { spaceId: sid, userId: uid } });
  };

  const amenityIcons: { [key: string]: React.ElementType } = {
    security: FaShieldAlt,
    cctv: FaVideo,
    charging: FaBolt,
    wheelchair: FaWheelchair,
    covered: FaUmbrella,
    '24/7': FaClock,
    surveillance: FaVideo,
    electric: FaBolt,
    accessible: FaWheelchair,
    disability: FaWheelchair,
    roof: FaUmbrella,
    indoor: FaUmbrella,
    '24hour': FaClock,
  };

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase();
    return amenityIcons[key] || FaCar;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Popup
      latitude={(space as any).location.coordinates[1]}
      longitude={(space as any).location.coordinates[0]}
      onClose={onClose}
      closeButton={false} // Disable default close button
      closeOnClick={false}
      anchor="top"
      offset={[0, -15]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ 
        maxWidth: '300px',
        minWidth: '280px',
        padding: 0,
        borderRadius: '12px',
      }}
      closeOnMove={false}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Custom Close Button - Smaller and better positioned */}
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-20 bg-white/95 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200 shadow-md border border-gray-200 hover:border-red-300"
          aria-label="Close popup"
        >
          <FaTimes className="text-xs" />
        </button>

        {/* Image Section - More compact */}
        <div className="relative h-28 bg-gradient-to-br from-blue-400 to-purple-500">
          <img
            src={images[currentImageIndex]}
            alt={(space as any).title || 'Parking space'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          {/* Carousel Controls - Smaller */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200 shadow-sm"
                aria-label="Previous image"
              >
                <FaChevronLeft className="text-2xs" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200 shadow-sm"
                aria-label="Next image"
              >
                <FaChevronRight className="text-2xs" />
              </button>
            </>
          )}
          
          {/* Rating Badge - Smaller */}
          {rating > 0 && (
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm">
              <FaStar className="text-yellow-500 mr-1 text-2xs" />
              <span className="text-xs font-semibold text-gray-800">{Number(rating).toFixed(1)}</span>
            </div>
          )}

          {/* Price Tag - More compact */}
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full shadow-md flex items-center gap-1">
            {hasDiscount ? (
              <div className="flex items-center gap-1">
                <div className="text-xs line-through text-white/70">{fmt(basePrice, 0)}</div>
                <div className="text-xs font-bold">{fmt(discountedPrice)}</div>
              </div>
            ) : (
              <div className="text-xs font-bold">{fmt(basePrice)}</div>
            )}

            {hasDiscount && (
              <div className="text-2xs font-semibold bg-white text-emerald-700 px-1 rounded">
                {discountPercent}%
              </div>
            )}
          </div>
        </div>

        {/* Content Area - More compact */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm mb-1 leading-tight line-clamp-1">
            {(space as any).title || 'Premium Parking Space'}
          </h3>

          {/* Location */}
          <div className="flex items-start text-gray-600 mb-2">
            <FaMapMarkerAlt className="text-red-500 mr-1 text-2xs mt-0.5 flex-shrink-0" />
            <span className="text-xs leading-tight line-clamp-2">{street}, {city}</span>
          </div>

          {/* Description */}
          {(space as any).description && (
            <p className="text-gray-600 text-xs mb-2 leading-relaxed line-clamp-2">
              {(space as any).description}
            </p>
          )}

          {/* Amenities - More compact */}
          {amenities.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {amenities.slice(0, 3).map((amenity, index) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 rounded text-2xs font-medium text-blue-700 border border-blue-100"
                      title={amenity}
                    >
                      <Icon className="mr-1 text-2xs text-blue-500" />
                      {amenity.length > 8 ? amenity.substring(0, 6) + '...' : amenity}
                    </span>
                  );
                })}
                {amenities.length > 3 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-2xs text-gray-600 font-medium">
                    +{amenities.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Book Button - More compact */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50/80">
          <button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 px-3 rounded-lg font-semibold text-xs shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <FaCheck className="text-2xs" />
            <span>Book Now</span>
            <span className="font-bold">- {fmt(hasDiscount ? discountedPrice : basePrice)}</span>
            <span className="text-2xs text-white/90">/hr</span>
          </button>
        </div>
      </div>
    </Popup>
  );
}