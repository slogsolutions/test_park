import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // Import socket.io-client
import { Dashboard } from './components/dashboard/Dashboard';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import ProviderBookings from './pages/ProivderBookings';
import LoadingScreen from './pages/LoadingScreen';
import { Provider, Booking } from './types';
import { Settings } from './components/dashboard/Settings';
import { Calendar } from './components/dashboard/Calendar';
import { Wallet } from './components/dashboard/Wallet';
import BookedSlots from './components/dashboard/BookedSlot';
import ProviderLocations from './components/dashboard/ProviderSpaces';
import { ProviderDashboard } from './components/dashboard/Deatils';
import { Profile } from './components/dashboard/Profile';
import { authService } from './services/auth.service';

function Dash() {
  const navigate = useNavigate();
  const [onlineStatus, setOnlineStatus] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('darkMode') || 'false');
    } catch {
      return false;
    }
  });

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL); // Connect to the socket server

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch provider details
        const providerRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
        console.log(providerRes.data);
        
        // providerRes.data may be either the user object or wrapped; adapt if needed
        const fetchedProvider = providerRes.data?.user ?? providerRes.data;
        setProvider(fetchedProvider);

        // set online status from fetched provider (default false if undefined)
        const initialOnline = Boolean(fetchedProvider?.onlineStatus ?? false);
        setOnlineStatus(initialOnline);

        // Fetch provider bookings
        const bookingsRes = await axios.get(`${API_BASE_URL}/api/booking/provider-bookings`, { headers });
        setBookings(bookingsRes.data);

        // Emit the 'register-provider' event once provider data is fetched
        const userId = fetchedProvider._id;
        socket.emit('register-provider', { userId });
        console.log('Provider registered:', userId);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array to run this effect only once when the component is mounted

  // apply theme class to root on mount and whenever darkMode changes
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // ignore (e.g. server side or restricted environment)
      console.warn('Could not apply theme class', e);
    }
  }, [darkMode]);

  // Handler to toggle dark mode (persist to localStorage and apply class)
  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      localStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (e) {
      // ignore storage errors
      console.warn('Could not persist theme preference', e);
    }
    // document.documentElement class toggled via effect above
  };

  // Handler to toggle online status — keeps UI in sync and updates backend
  const handleToggleOnline = async () => {
    try {
      const newStatus = !onlineStatus;
      // call backend via authService (expects authService.setOnline to be implemented)
      await authService.setOnline(newStatus);
      // update local state
      setOnlineStatus(newStatus);
      // also update provider object if present so downstream components see updated value
      setProvider((prev) => prev ? { ...prev, onlineStatus: newStatus } : prev);
    } catch (err) {
      console.error('Failed to update online status', err);
    }
  };

  const handlePayment = async (bookingId: string, amount: number) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Initiate Payment
      const paymentRes = await axios.post(`${API_BASE_URL}/api/payment/initiate-payment`, { bookingId, amount }, { headers });
      const { orderId } = paymentRes.data;

      // Step 2: Redirect to Razorpay
      const options = {
        key: 'rzp_test_eQoJ7XZxUf37D7',
        amount: amount * 100, 
        currency: 'INR',
        name: 'Parking App',
        description: 'Booking Payment',
        order_id: orderId,
        handler: async (response: any) => {
          await verifyPayment(response, bookingId);
        },
        prefill: {
          email: provider?.email || '',
          contact: provider?.phone || '',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  const verifyPayment = async (response: any, bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const verifyRes = await axios.post(`${API_BASE_URL}/api/payment/verify-payment`, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        bookingId,
      }, { headers });

      if (verifyRes.data.success) {
        alert('Payment successful!');
      } else {
        alert('Payment verification failed.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    }
  };

  if (loading) {
    return  <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <LoadingScreen/>
    </div>;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900">
      {/* pass onlineStatus and onToggleOnline props to Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        className="hidden md:flex"
        onlineStatus={onlineStatus}
        onToggleOnline={handleToggleOnline}
      />

      <div>
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {currentPage === 'dashboard' && provider && (
            <Dashboard provider={provider} bookings={bookings} onPay={handlePayment} />
          )}
          {currentPage === 'bookings' && <ProviderBookings />}
          {currentPage === 'ProviderDash' && <ProviderDashboard />}
          {currentPage === 'BookedSlots' && <BookedSlots bookings={bookings} />}
          {currentPage === 'Profile' && <Profile />}
          {/* {currentPage === 'calander' && <Calendar />}
          {currentPage === 'wallet' && <Wallet />} */}
        </main>
        <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>
    </div>
  );
}

export default Dash;
