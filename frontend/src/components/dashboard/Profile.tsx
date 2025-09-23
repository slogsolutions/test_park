import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { UserCheck, MapPin, Calendar } from 'lucide-react';
import { Booking, Provider } from '../../types';
import ProviderLocations from './ProviderSpaces';
import BookedSlots from './BookedSlot';
import axios from 'axios';
import LoadingScreen from '../../pages/LoadingScreen';
import { Wallet } from './Wallet';
import { Settings } from './Settings';

interface ProfileProps {
  provider: Provider;
}

export function Profile() {
      const [currentPage, setCurrentPage] = useState('ProviderLocations');
      const [loading, setLoading] = useState(true);
      const [provider, setProvider] = useState<Provider | null>(null);
      const [bookings, setBookings] = useState<Booking[]>([]);
      const [darkMode, setDarkMode] = useState(() => {
        return JSON.parse(localStorage.getItem('darkMode') || 'false');
      });
    
      const API_BASE_URL = import.meta.env.VITE_BASE_URL;
    
      useEffect(() => {
        const fetchData = async () => {
          try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
    
            // Fetch provider details
            const providerRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
            console.log(provider);
            
            setProvider(providerRes.data);
    
            // Fetch provider bookings
            const bookingsRes = await axios.get(`${API_BASE_URL}/api/booking/provider-bookings`, { headers });
            setBookings(bookingsRes.data);
    
          } catch (error) {
            console.error('Error fetching data:', error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, []);
    
    
  return (
    <div className="mx-5 mb-52 my-5 h-screen bg-gray-100">
      {/* Sidebar */}
    
      {/* Main Content */}
        {/* Toggle Buttons */}
        <div className="flex space-x-4 mb-6">
        <button 
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            currentPage === 'Profile' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`} 
          onClick={() => setCurrentPage('ProviderLocations')}
        >
          Provider Locations
        </button>
        <button 
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            currentPage === 'Settings' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`} 
          onClick={() => setCurrentPage('Settings')}
        >
         Settings
        </button>
      </div>
      <div className="mt-6">
        {currentPage === 'Profile' && <ProviderLocations />}
        {currentPage === 'Settings' && <Settings  />}
        {/* {currentPage === 'Wallet' && <Wallet bookings={bookings} />} */}
      </div>
    </div>
  );
}
