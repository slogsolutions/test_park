import axios from 'axios';

export interface GeocodingResult {
  longitude: number;
  latitude: number;
  placeName: string;
}

export const searchLocation = async (query: string): Promise<GeocodingResult[]> => {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A`
    );
    
    return response.data.features.map((feature: any) => ({
      longitude: feature.center[0],
      latitude: feature.center[1],
      placeName: feature.place_name,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

