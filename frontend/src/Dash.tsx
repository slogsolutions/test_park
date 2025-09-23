// import React, { useState, useEffect } from 'react';
// import { OTPVerification } from './components/auth/OTPVerification';
// import { Calendar } from './components/dashboard/Calendar';
// import { BookingManagement } from './components/dashboard/BookingManagement';
// import { Wallet } from './components/dashboard/Wallet';
// import { Settings } from './components/dashboard/Settings';
// import { Dashboard } from './components/dashboard/Dashboard';
// import { Profile } from './components/dashboard/Profile';
// import { Sidebar } from './components/layout/Sidebar';
// import { BottomNav } from './components/layout/BottomNav';
// import { Provider, TimeSlot, Booking, Transaction } from './types';
// import ProviderBookings from './pages/ProivderBookings';
// import { useNavigate } from 'react-router-dom';
// import { KYCFormData, KYCState } from './types/kyc';
// import LoadingScreen from './pages/LoadingScreen';


// function Dash() {
//   const [isVerified, setIsVerified] = useState(false);
//   const [currentPage, setCurrentPage] = useState('dashboard');
//     const [loadingKycStatus, setLoadingKycStatus] = useState(true);
  
//   const navigate=useNavigate();
//     const [kycStatus, setKycStatus] = useState<string | null>(null);
  
//     const [state, setState] = useState<KYCState>({
//       step: 1,
//       loading: false,
//       error: null,
//       success: false,
//     });
//   const [darkMode, setDarkMode] = useState(() => {
//     const savedMode = localStorage.getItem('darkMode');
//     return savedMode ? JSON.parse(savedMode) : false;
//   });

//    useEffect(() => {
//       const fetchKycStatus = async () => {
//         try {
//           setLoadingKycStatus(true);
//           const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/kyc/status`, {
//             method: 'GET',
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('token')}`,
//             },
//           });
  
//           if (!response.ok) {
//             throw new Error('Failed to fetch KYC status');
//           }
  
//           const data = await response.json();
//           setKycStatus(data.status);
//           console.log(data.status);
          
  
          
//         } catch (error: any) {
//           setState((prev) => ({
//             ...prev,
//             error: error.message || 'Failed to fetch KYC status',
//           }));
//         } finally {
//           setLoadingKycStatus(false);
//         }
//       };
  
//       fetchKycStatus();
//     }, []);
//   const renderKycStatus = () => {
//     if (kycStatus === 'pending') {
//       return (
//         <div className="mt-8 text-center bg-red-50 ">
//           <h3 className="text-xl font-semibold">Verify your KYC</h3>
//           <p>Your KYC is submitted and is currently under verification. We will update you once it's processed.</p>
//         </div>
//       );
//     }

//     if (kycStatus === 'submitted') {
//       return (
//         <div className="mt-8 text-center bg-green-50 border-l-4 border-green-400 text-green-700 p-4">
//           <h3 className="text-xl font-semibold">KYC Approved</h3>
//           <p>Your KYC has been approved! You can now register your location.</p>
//           <button
//             onClick={() => navigate('/register-parking')}
//             className="mt-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform transition-transform hover:scale-105"
//           >
//             Register Location
//           </button>
//         </div>
//       );
//     }

//     return null;
//   };
//   const [provider, setProvider] = useState<Provider>({
//     id: '1',
//     name: 'Mohit',
//     email: 'mohit123@gmail.com',
//     phone: '+917893453214',
//     isVerified: false,
//     isOnline: false,
//     walletBalance: 1250.75,
//   });

//   // Effect to handle dark mode
//   useEffect(() => {
//     if (darkMode) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//     localStorage.setItem('darkMode', JSON.stringify(darkMode));
//   }, [darkMode]);

//   // Mock data
//   const [timeSlots] = useState<TimeSlot[]>([
//     {
//       id: '1',
//       startTime: new Date('2024-03-20T10:00:00'),
//       endTime: new Date('2024-03-20T14:00:00'),
//       isRecurring: true,
//       recurringDays: [1],
//     },
//     {
//       id: '2',
//       startTime: new Date('2024-03-21T09:00:00'),
//       endTime: new Date('2024-03-21T12:00:00'),
//       isRecurring: false,
//     },
//     {
//       id: '3',
//       startTime: new Date('2024-03-22T14:00:00'),
//       endTime: new Date('2024-03-22T17:00:00'),
//       isRecurring: true,
//       recurringDays: [3, 5],
//     },
//   ]);

//   const [bookings, setBookings] = useState<Booking[]>([
//     {
//       id: '1',
//       customerId: 'c1',
//       customerName: 'Sonu',
//       serviceId: 's1',
//       serviceName: 'Consultation',
//       startTime: new Date('2024-03-21T11:00:00'),
//       endTime: new Date('2024-03-21T12:00:00'),
//       status: 'pending',
//       price: 75.00,
//     },
//     {
//       id: '2',
//       customerId: 'c2',
//       customerName: 'Nitin',
//       serviceId: 's2',
//       serviceName: 'Advisory Session',
//       startTime: new Date('2024-03-22T14:00:00'),
//       endTime: new Date('2024-03-22T15:00:00'),
//       status: 'accepted',
//       price: 90.00,
//     },
//   ]);

//   const [transactions] = useState<Transaction[]>([
//     {
//       id: '1',
//       amount: 75.00,
//       type: 'credit',
//       description: 'Payment for consultation',
//       timestamp: new Date('2024-03-19T15:30:00'),
//       status: 'completed',
//     },
//   ]);

//   const handleToggleOnline = () => {
//     setProvider({ ...provider, isOnline: !provider.isOnline });
//   };

//   const handleLogout = () => {
//     setIsVerified(false);
//     setProvider({ ...provider, isVerified: false });
//   };

//   const handleUpdateProfile = (updatedProfile: Partial<Provider>) => {
//     setProvider({ ...provider, ...updatedProfile });
//   };




//   const renderContent = () => {
//     switch (currentPage) {
//       case 'dashboard':
//         return <Dashboard provider={provider} bookings={bookings} />;
//       case 'availability':
//         return (
//           <Calendar
//             timeSlots={timeSlots}
//             onAddSlot={() => {}}
//             onEditSlot={() => {}}
//             onDeleteSlot={() => {}}
//           />
//         );
//       case 'bookings':
//         return (
//                 <ProviderBookings/>
//         );
//       case 'wallet':
//         return (
//           <Wallet
//             balance={provider.walletBalance}
//             transactions={transactions}
//             onRequestPayout={() => {}}
//           />
//         );
//       case 'profile':
//         return <Profile provider={provider} onUpdateProfile={handleUpdateProfile} />;
//       case 'settings':
//         return <Settings />;
//       default:
//         return <Dashboard provider={provider} bookings={bookings} />;
//     }
//   };
//   if (loadingKycStatus) {
//     return <div className="h-[calc(100vh-64px)] flex items-center justify-center"> 
//       <LoadingScreen/>
//     </div>;
//   }


//   return (
//     <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900">
      
     
//       <Sidebar
//         currentPage={currentPage}
//         onNavigate={setCurrentPage}
//         onlineStatus={provider.isOnline}
//         onToggleOnline={handleToggleOnline}
//         darkMode={darkMode}
//         onToggleDarkMode={() => setDarkMode(!darkMode)}
//         onLogout={handleLogout}
//         className="hidden md:block"
//       />  
//       <div>
//        {state.success || kycStatus === 'pending' ? (
//             renderKycStatus()
//           ) : (
    
//       <main className="flex-1 overflow-y-auto pb-16 md:pb-0 ">
//         {renderContent()}
//       </main>
//     )}
//       <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
//     </div>

//     </div>
//   );
// }

// export default Dash;


// working code -----------------------------------------------------------------=------------------------

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { Dashboard } from './components/dashboard/Dashboard';
// import { Sidebar } from './components/layout/Sidebar';
// import { BottomNav } from './components/layout/BottomNav';
// import ProviderBookings from './pages/ProivderBookings';
// import LoadingScreen from './pages/LoadingScreen';
// import { Provider, Booking } from './types';
// import { Settings } from './components/dashboard/Settings';
// import { Calendar } from './components/dashboard/Calendar';
// import { Wallet } from './components/dashboard/Wallet';
// import BookedSlots from './components/dashboard/BookedSlot';
// import ProviderLocations from './components/dashboard/ProviderSpaces';
// import { ProviderDashboard } from './components/dashboard/Deatils';
// import { Profile } from './components/dashboard/Profile';

// function Dash() {
//   const navigate = useNavigate();
  
//   const [currentPage, setCurrentPage] = useState('dashboard');
//   const [loading, setLoading] = useState(true);
//   const [provider, setProvider] = useState<Provider | null>(null);
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [darkMode, setDarkMode] = useState(() => {
//     return JSON.parse(localStorage.getItem('darkMode') || 'false');
//   });

//   const API_BASE_URL = import.meta.env.VITE_BASE_URL;

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = { Authorization: `Bearer ${token}` };

//         // Fetch provider details
//         const providerRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
//         console.log(provider);
        
//         setProvider(providerRes.data);

//         // Fetch provider bookings
//         const bookingsRes = await axios.get(`${API_BASE_URL}/api/booking/provider-bookings`, { headers });
//         setBookings(bookingsRes.data);

//       } catch (error) {
//         console.error('Error fetching data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const handlePayment = async (bookingId: string, amount: number) => {
//     try {
//       const token = localStorage.getItem('token');
//       const headers = { Authorization: `Bearer ${token}` };

//       // Step 1: Initiate Payment
//       const paymentRes = await axios.post(`${API_BASE_URL}/api/payment/initiate-payment`, { bookingId, amount }, { headers });
//       const { orderId } = paymentRes.data;

//       // Step 2: Redirect to Razorpay
//       const options = {
//         key: 'rzp_test_eQoJ7XZxUf37D7',
//         amount: amount * 100, 
//         currency: 'INR',
//         name: 'Parking App',
//         description: 'Booking Payment',
//         order_id: orderId,
//         handler: async (response: any) => {
//           await verifyPayment(response, bookingId);
//         },
//         prefill: {
//           email: provider?.email || '',
//           contact: provider?.phone || '',
//         },
//       };

//       const rzp = new (window as any).Razorpay(options);
//       rzp.open();
//     } catch (error) {
//       console.error('Error initiating payment:', error);
//     }
//   };

//   const verifyPayment = async (response: any, bookingId: string) => {
//     try {
//       const token = localStorage.getItem('token');
//       const headers = { Authorization: `Bearer ${token}` };

//       const verifyRes = await axios.post(`${API_BASE_URL}/api/payment/verify-payment`, {
//         razorpay_order_id: response.razorpay_order_id,
//         razorpay_payment_id: response.razorpay_payment_id,
//         razorpay_signature: response.razorpay_signature,
//         bookingId,
//       }, { headers });

//       if (verifyRes.data.success) {
//         alert('Payment successful!');
//       } else {
//         alert('Payment verification failed.');
//       }
//     } catch (error) {
//       console.error('Error verifying payment:', error);
//     }
//   };

//   if (loading) {
//     return  <div className="h-[calc(100vh-64px)] flex items-center justify-center">
//     <LoadingScreen/>
//    </div>
//   }

//   return (
//     <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900">
//       <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} darkMode={darkMode} className="hidden md:flex" />

//       <div>
//         <main className="flex-1 overflow-y-auto pb-16 md:pb-0 ">
//           {currentPage === 'dashboard' && provider && (
//             <Dashboard provider={provider} bookings={bookings} onPay={handlePayment} />
//           )}
//           {currentPage === 'bookings' && <ProviderBookings />}
//           {currentPage === 'ProviderDash' && <ProviderDashboard  />}
//           {currentPage === 'BookedSlots' && <BookedSlots bookings={bookings} />}
//           {currentPage === 'Profile' && <Profile />}
//           {/* {currentPage === 'calander' && <Calendar />}
//           {currentPage === 'wallet' && <Wallet />} */}
//         </main>
//         <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
//       </div>
//     </div>
//   );
// }

// export default Dash;


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

function Dash() {
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode') || 'false');
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
        
        setProvider(providerRes.data);

        // Fetch provider bookings
        const bookingsRes = await axios.get(`${API_BASE_URL}/api/booking/provider-bookings`, { headers });
        setBookings(bookingsRes.data);

        // Emit the 'register-provider' event once provider data is fetched
        const userId = providerRes.data._id;
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
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} darkMode={darkMode} className="hidden md:flex" />

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
