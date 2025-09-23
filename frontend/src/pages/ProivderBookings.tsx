// import React, { useEffect, useState } from 'react';
// import { io } from 'socket.io-client';
// import { CalendarDays } from 'lucide-react';
// import { motion } from 'framer-motion';
// import LoadingScreen from './LoadingScreen';
// import { useAuth } from '../context/AuthContext';  // Assuming the path to your context

// // Parking request interface
// interface ParkingRequest {
//   id: string;  // Added unique id for each parking request
//   location: {
//     latitude: number;
//     longitude: number;
//   };
// }

// const ProviderNotifications = () => {
//   const [notifications, setNotifications] = useState<ParkingRequest[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Access authentication context
//   const { user, isAuthenticated, loading: authLoading } = useAuth();

//   // Socket connection to backend
//   const socket = io('http://localhost:5000'); // Replace with your backend URL
//   useEffect(() => {
//     if (!isAuthenticated || !user) {
//       console.error('User is not authenticated or user data is missing');
//       return;
//     }

//     console.log("Registered User:", user._id);  // Log user object to inspect

//     // Listen for new parking request notifications
//     socket.on('new-parking-request', (request: ParkingRequest) => {
//       setNotifications((prev) => [...prev, request]);

//       // Set loading to false only once when the first notification is received
//       if (loading) {
//         setLoading(false);
//       }
//     });

//     // Register the provider with the actual userId
//     socket.emit('register-provider', { userId: user._id });  // Use user._id

//     return () => {
//       socket.off('new-parking-request');
//     };
//   }, [isAuthenticated, user, loading]);  // Adding loading to dependency array

//   // Handle accept and reject button clicks
//   const handleAccept = async (parkingRequest: ParkingRequest) => {
//     try {
//       console.log("Creating booking for request:", parkingRequest);
  
//       const token = localStorage.getItem('token');
  
//       console.log("User ID is ------------", user?._id);
  
//       const formData = new FormData();
//       formData.append('parkingSpaceId', parkingRequest); // Use the nearest space ID
//       formData.append('userId', user?._id || "65b9f1a0e3a8a5d4c8b6f456");
//       formData.append('startTime', new Date().toISOString());
//       formData.append('endTime', new Date(Date.now() + 60 * 60 * 1000).toISOString());
//       formData.append('vehicleNumber', "AB123CD");
//       formData.append('vehicleType', "Car");
//       formData.append('vehicleModel', "Toyota Corolla");
//       formData.append('contactNumber', "9876543210");
//       formData.append('chassisNumber', "XYZ123456789");
  
//       const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });
  
//       if (!response.ok) {
//         const error = await response.json();
//         console.error('Error:', error);
//         alert(`Error: ${error.message}`);
//         return;
//       }
  
//       const data = await response.json();
//       alert(`Booking confirmed! Reference: ${data.referenceId}`);
  
//       // Remove the accepted request from notifications
//       setNotifications((prev) => prev.filter((n) => n.id !== parkingRequest));
  
//       console.log("emititng provider accept");
      
//       // ✅ Emit "provider-accepted" socket event
//       socket.emit('accept-parking-request', {
//         providerId: user?._id,  // Send provider's ID
//         parkingSpaceId: parkingRequest, // Send the accepted parking space ID
//         userId: parkingRequest, // User who made the request
//         referenceId: data.referenceId, // Booking reference
//       });
  
//     } catch (error) {
//       console.error('Error while creating booking:', error);
//       alert('An error occurred while processing the booking.');
//     }
//   };
  
  
//   // Function to calculate distance between two locations
//   const getDistance = (location1, location2) => {
//     const toRad = (value) => (value * Math.PI) / 180;
//     const R = 6371; // Radius of Earth in km
  
//     const dLat = toRad(location2.lat - location1.lat);
//     const dLon = toRad(location2.lng - location1.lng);
//     const lat1 = toRad(location1.lat);
//     const lat2 = toRad(location2.lat);
  
//     const a = 
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in km
//   };
  
  

//   const handleReject = async (bookingId: string) => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/reject/${bookingId}`, {
//         method: 'POST',
//       });

//       if (!response.ok) {
//         console.error('Failed to reject booking');
//       } else {
//         console.log('Booking rejected');
//         // You can update the UI after rejecting, like removing the notification or marking it as rejected
//       }
//     } catch (error) {
//       console.error('Error while rejecting booking:', error);
//     }
//   };

//   if (loading || authLoading) {
//     return (
//       <div className="h-[calc(100vh-64px)] flex items-center justify-center">
//         <LoadingScreen />
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white dark:bg-gray-900 mx-auto">
//       <div className="max-w-fit mx-auto p-4 sm:p-6 lg:p-8">
//         <div className="mb-8">
//           <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
//             <CalendarDays className="h-7 w-7 text-primary-500 mr-3" />
//             Parking Provider Notifications
//           </h2>
//         </div>

//         {/* Notifications List */}
//         <div className="space-y-4">
//           {notifications.map((notification) => (
//             <motion.div key={notification.id} layout className="p-6 border rounded-xl">
//               <div className="flex justify-between">
//                 <div>
//                   <h3 className="text-lg font-medium">New Parking Request</h3>
//                   <p className="text-sm text-gray-500">
//                     Location: Latitude {notification.location.latitude}, Longitude {notification.location.longitude}
//                   </p>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleAccept(notification.parkingSpaceId)}
//                     className="px-4 py-2 bg-green-600 text-white rounded-lg"
//                   >
//                     Accept
//                   </button>
//                   <button
//                     onClick={() => handleReject(notification.id)}
//                     className="px-4 py-2 bg-red-600 text-white rounded-lg"
//                   >
//                     Reject
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProviderNotifications;




import React, { useEffect, useState } from 'react';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  Search,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

interface Booking {
  id: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const handleStatusChange = async (bookingId:any, newStatus:any) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          });
    
          if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.message}`);
            return;
          }
    
          setBookings((prevBookings:any) =>
            prevBookings.map((booking:any) =>
              booking._id === bookingId ? { ...booking, status: newStatus } : booking
            )
          );
    
          alert(`Booking status updated to ${newStatus}.`);
        } catch (err) {
          console.error('Error updating status:', err);
          alert('Failed to update status.');
        }
      };
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/provider-bookings`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch bookings');

        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // const onAcceptBooking = async (bookingId: string) => {
  //   try {
  //     await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/accept/${bookingId}`, { method: 'POST' });
  //     setBookings(prev => prev.map(booking => booking.id === bookingId ? { ...booking, status: 'accepted' } : booking));
  //   } catch (error) {
  //     console.error('Failed to accept booking', error);
  //   }
  // };

  const onRejectBooking = async (bookingId: string, reason: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/reject/${bookingId}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      setBookings(prev => prev.map(booking => booking.id === bookingId ? { ...booking, status: 'rejected' } : booking));
    } catch (error) {
      console.error('Failed to reject booking', error);
    }
  };

  const handleReject = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (selectedBooking && rejectReason.trim()) {
      onRejectBooking(selectedBooking, rejectReason);
      setSelectedBooking(null);
      setRejectReason('');
    }
  };

  const filterBookings = () => {
    return bookings.filter((booking) => {
      const name = booking.customerName ? booking.customerName.toLowerCase() : "";
      const service = booking.serviceName ? booking.serviceName.toLowerCase() : "";
      
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || service.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
  
      let matchesDate = true;
      const bookingDate = booking.startTime ? new Date(booking.startTime) : null;
      const today = new Date();
  
      if (bookingDate) {
        if (dateFilter === "today") {
          matchesDate = bookingDate.toDateString() === today.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = bookingDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = bookingDate >= monthAgo;
        }
      }
  
      return matchesSearch && matchesStatus && matchesDate;
    });
  };
  const getStatusIcon = (status: string) => {
      switch (status) {
        case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
        case 'rejected': return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
        default: return <Clock3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
      }
    };

    const getStatusBgColor = (status: string) => {
      switch (status) {
        case 'accepted': return 'bg-green-50 dark:bg-green-900/20';
        case 'rejected': return 'bg-red-50 dark:bg-red-900/20';
        default: return 'bg-primary-50 dark:bg-primary-900/20';
      }
    };

  const filteredBookings = filterBookings();


  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <LoadingScreen/>
     </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-900  mx-auto">
      <div className="max-w-fit  mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarDays className="h-7 w-7 text-primary-500 mr-3" />
            Provider Bookings
          </h2>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {filteredBookings.map((booking:any) => (
            <motion.div key={booking.id} layout className="p-6 border rounded-xl">
               <div className={`p-2 rounded-lg ${getStatusBgColor(booking.status)} mr-4`}>
                      {getStatusIcon(booking.status)}
                    </div>
              <div className="flex justify-between">
            
                <div>
                  <h3 className="text-lg font-medium">{booking.user.name}</h3>
                  <p className="text-sm text-gray-500">{booking.serviceName}</p>
                  <p className="text-sm text-gray-500"><Calendar className="inline-block w-4 h-4 mr-2" /> {new Date(booking.startTime).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500"><Clock className="inline-block w-4 h-4 mr-2" /> {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                <p>Price: {booking.totalPrice ? booking.totalPrice.toFixed(2) : "N/A"}</p>
                  <p className={`text-sm font-medium ${booking.status === 'accepted' ? 'text-green-600' : booking.status === 'rejected' ? 'text-red-600' : 'text-red-600'}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </p>
                </div>
              </div>

              {booking.status === 'pending' && (
                <div className="mt-4 flex space-x-3">
                  {selectedBooking === booking.id ? (
                    <>
                      <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="w-full px-4 py-2 border rounded-lg"></textarea>
                      <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button>
                    </>
                  ) : (
                    <>
                      <button   onClick={() => handleStatusChange(booking._id, 'accepted')}   className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">Accept</button>
                      <button onClick={() => handleReject(booking.id)}  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">Reject</button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderBookings
