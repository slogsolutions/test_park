export interface ParkingSpace {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  availableSpots: number;
  totalSpots: number;
  distance?: number;
  description?: string;
}

export interface ParkingFormData {
  name: string;
  totalSpots: string;
  description: string;
}