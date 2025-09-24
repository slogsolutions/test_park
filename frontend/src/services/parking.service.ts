import api from '../utils/api';
import { ParkingSpace } from '../types/parking';

export const parkingService = {
  // Get nearby parking spaces based on location and radius
  async getNearbySpaces(lat: number, lng: number, radius: number) {
    const response = await api.get<ParkingSpace[]>(
      `/parking?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data;
  },

  // Register a parking space (FormData, with photos)
  async registerSpaceFormData(data: FormData) {
    const token = localStorage.getItem('token');
    // Use relative path /parking (api instance likely has baseURL configured)
    const response = await api.post('/parking', data, {
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT set 'Content-Type' manually for FormData; browser sets boundary
      },
    });
    console.log('registerSpaceFormData response:', response.data);
    return response.data;
  },

  // Register a parking space (JSON, no photos)
  async registerSpaceJSON(payload: any) {
    const token = localStorage.getItem('token');
    const response = await api.post('/parking', payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('registerSpaceJSON response:', response.data);
    return response.data;
  },

  // New convenience wrapper - choose method automatically or use directly from UI:
  // If caller passes FormData -> call FormData handler; otherwise JSON handler.
  async registerSpace(data: FormData | Record<string, any>) {
    if (data instanceof FormData) {
      return this.registerSpaceFormData(data);
    } else {
      return this.registerSpaceJSON(data);
    }
  },

  // Get user's own parking spaces
  async getMySpaces() {
    // Use relative path to remain consistent with other methods
    const response = await api.get('/parking/my-spaces');
    return response.data;
  },

  // Get a specific parking space by ID
  async getSpaceById(id: string) {
    const response = await api.get(`/parking/${id}`);
    return response.data;
  },

  // Get filtered parking spaces based on location, radius, and amenities
  async getFilteredSpaces({
    lat,
    lng,
    radius,
    amenities,
  }: {
    lat: number;
    lng: number;
    radius: number;
    amenities: string[];
  }) {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      amenities: amenities.join(','),
    });

    const response = await api.get<ParkingSpace[]>(
      `/parking/filter?${queryParams.toString()}`
    );
    return response.data;
  },
};

export default parkingService;
