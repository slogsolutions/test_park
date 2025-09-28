// src/services/parking.service.ts
import api from '../utils/api';
import { ParkingSpace } from '../types/parking';

export const parkingService = {
  /**
   * Get nearby parking spaces based on location.
   * radius is optional. If provided it will be included in the query.
   */
  async getNearbySpaces(lat: number, lng: number, radius?: number) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });

    if (typeof radius === 'number') {
      params.set('radius', radius.toString());
    }

    const url = `/parking?${params.toString()}`;
    const response = await api.get<ParkingSpace[]>(url);
    return response.data;
  },

  /**
   * Try to fetch *all* parking spaces.
   * This endpoint may not exist on all backends; it's a convenience.
   * If your backend doesn't expose /parking/all, this will likely return 404
   * and callers should fall back to getNearbySpaces.
   */
  async getAllSpaces() {
    const response = await api.get<ParkingSpace[]>('/parking/all');
    return response.data;
  },

  // Register a parking space (FormData, with photos)
  async registerSpaceFormData(data: FormData) {
    const token = localStorage.getItem('token');
    const response = await api.post('/parking', data, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Let browser set Content-Type for FormData
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

  // Convenience wrapper: decides FormData vs JSON
  async registerSpace(data: FormData | Record<string, any>) {
    if (data instanceof FormData) {
      return this.registerSpaceFormData(data);
    } else {
      return this.registerSpaceJSON(data);
    }
  },

  // Get user's own parking spaces
  async getMySpaces() {
    const response = await api.get('/parking/my-spaces');
    return response.data;
  },

  // Get a specific parking space by ID
  async getSpaceById(id: string) {
    const response = await api.get(`/parking/${id}`);
    return response.data;
  },

  // Get filtered parking spaces based on optional radius and amenities
  async getFilteredSpaces({
    lat,
    lng,
    radius,
    amenities,
  }: {
    lat: number;
    lng: number;
    radius?: number;
    amenities?: string[];
  }) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });

    if (typeof radius === 'number') params.set('radius', radius.toString());
    if (amenities && amenities.length > 0) params.set('amenities', amenities.join(','));

    const response = await api.get<ParkingSpace[]>(`/parking/filter?${params.toString()}`);
    return response.data;
  },

  // Toggle per-space online status
  async toggleOnline(spaceId: string, isOnline: boolean) {
    console.log('API call toggleOnline ->', spaceId, isOnline);
    const response = await api.patch(`/parking/${spaceId}/online`, { isOnline });
    return response.data;
  },

  // Soft-delete a parking space
  async deleteSpace(spaceId: string) {
    const response = await api.delete(`/parking/${spaceId}`);
    return response.data;
  },
};

export default parkingService;
