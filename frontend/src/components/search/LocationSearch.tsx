import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { MdGpsFixed } from 'react-icons/md';
import { searchLocation, GeocodingResult } from '../../utils/geocoding';

interface LocationSearchBoxProps {
  onLocationSelect: (location: GeocodingResult) => void;
  onGoToCurrentLocation: () => void;
}

const LocationSearchBox = ({ onLocationSelect, onGoToCurrentLocation }: LocationSearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        const locations = await searchLocation(query);
        setResults(locations);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto absolute left-1/2 transform -translate-x-1/2 sm:left-20 sm:left-96 z-10">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex flex-grow">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full px-4 py-3 pl-10 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-red-400 focus:outline-none"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <Search className="absolute left-3 top-3 text-gray-500" />
          )}
        </div>

        {/* Go to Current Location Button */}
        <button
          onClick={onGoToCurrentLocation}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded shadow-lg hover:bg-red-700"
        >
          <MdGpsFixed size={20} />
          <p className='hidden sm-hidden '>Go to Current Location</p>
    
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute z-10 w-full mt-1 p-2 text-center bg-white rounded-md shadow-lg">
          <span className="text-gray-600">Searching...</span>
        </div>
      )}

      {/* Search Results Dropdown */}
      {results.length > 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          {results.map((result, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none rounded-md"
              onClick={() => {
                onLocationSelect(result);
                setQuery(result.placeName);
                setResults([]);
              }}
            >
              {result.placeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchBox;
