// frontend/src/pages/Requests.tsx
import React, { useEffect, useState } from 'react';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  CalendarDays,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

interface Booking {
  _id?: string;
  id?: string;
  customerName?: string;
  serviceName?: string;
  startTime?: string;
  price?: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed';
  user?: { name: string };
  totalPrice?: number;
  paymentStatus?: string;
  otpVerified?: boolean;
  providerId?: string | null;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [verifyingOtp, setVerifyingOtp] = useState<string | null>(null);

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

  const handleStatusChange = async (bookingId: any, newStatus: any) => {
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

      const data = await response.json();
      const updatedBooking = data.booking || null;

      setBookings((prevBookings: any) =>
        prevBookings.map((booking: any) =>
          booking._id === bookingId ? { ...booking, status: newStatus, providerId: updatedBooking?.providerId || booking.providerId } : booking
        )
      );

      alert(`Booking status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const onRejectBooking = async (bookingId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rejected', reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.message}`);
        return;
      }

      setBookings(prev => prev.map(booking => 
        (booking._id === bookingId || booking.id === bookingId) 
          ? { ...booking, status: 'rejected' } 
          : booking
      ));
    } catch (error) {
      console.error('Failed to reject booking', error);
      alert('Failed to reject booking.');
    }
  };

  // Verify OTP function
  const verifyOtpForBooking = async (bookingId: string) => {
    if (!otpInput.trim()) {
      alert('Please enter OTP');
      return;
    }

    setVerifyingOtp(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otpInput }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'OTP verification failed');
        return;
      }

      alert('OTP verified — booking confirmed!');
      // Update local booking status to match backend
      setBookings(prev => prev.map(booking => 
        (booking._id === bookingId || booking.id === bookingId) 
          ? { ...booking, status: 'confirmed', otpVerified: true, startedAt: data.booking?.startedAt || new Date().toISOString(), sessionEndAt: data.booking?.sessionEndAt || null } 
          : booking
      ));
      
      // Clear OTP input
      setOtpInput('');
      setVerifyingOtp(null);
    } catch (err) {
      console.error('verify OTP error', err);
      alert('Error verifying OTP');
    } finally {
      setVerifyingOtp(null);
    }
  };

  const handleReject = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setRejectReasons((prev) => ({ ...prev, [bookingId]: '' }));
  };

  const confirmReject = () => {
    if (selectedBooking) {
      const reason = (rejectReasons[selectedBooking] || '').trim();
      if (!reason) {
        alert('Please provide a reason before rejecting.');
        return;
      }
      onRejectBooking(selectedBooking, reason);
      setSelectedBooking(null);
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[selectedBooking];
        return next;
      });
    }
  };

  const filterBookings = () => {
    return bookings.filter((booking) => {
      const name = booking.user?.name ? booking.user.name.toLowerCase() : (booking.customerName || "").toLowerCase();
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
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default: return <Clock3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 dark:bg-green-900/20';
      case 'rejected': return 'bg-red-50 dark:bg-red-900/20';
      case 'confirmed': return 'bg-blue-50 dark:bg-blue-900/20';
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
    <div className="bg-white dark:bg-gray-900 mx-auto">
      <div className="max-w-fit mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarDays className="h-7 w-7 text-primary-500 mr-3" />
            Provider Requests
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
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => {
            const stableId = booking._id || booking.id;
            return (
              <motion.div key={stableId} layout className="p-6 border rounded-xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg ${getStatusBgColor(booking.status)} mr-4`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{booking.user?.name || booking.customerName}</h3>
                      <p className="text-sm text-gray-500">{booking.serviceName}</p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="inline-block w-4 h-4 mr-2" /> 
                        {booking.startTime ? new Date(booking.startTime).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <Clock className="inline-block w-4 h-4 mr-2" /> 
                        {booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">₹{booking.totalPrice ? Math.ceil(booking.totalPrice) : "N/A"}</p>
                    <p className={`text-sm font-medium ${booking.status === 'accepted' ? 'text-green-600' : booking.status === 'rejected' ? 'text-red-600' : booking.status === 'confirmed' ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {booking.status ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1)) : 'Unknown'}
                    </p>
                    {booking.paymentStatus && (
                      <p className={`text-xs ${booking.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                        Payment: {booking.paymentStatus}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons - show different options based on status and payment */}
                {booking.status === 'pending' && (
                  <div className="mt-4">
                    {selectedBooking === stableId ? (
                      <div className="flex space-x-3">
                        <textarea
                          value={rejectReasons[stableId] || ""}
                          onChange={(e) => setRejectReasons(prev => ({ ...prev, [stableId]: e.target.value }))}
                          placeholder="Reason for rejection..."
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <button 
                          onClick={confirmReject} 
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Confirm Reject
                        </button>
                        <button 
                          onClick={() => setSelectedBooking(null)} 
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleStatusChange(booking._id, 'accepted')} 
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleReject(stableId)} 
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Verification section - only show for paid bookings that are accepted */}
                {booking.paymentStatus === 'paid' && booking.status === 'accepted' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                    <div className="flex items-center mb-3">
                      <Key className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-semibold text-blue-800">OTP Verification Required</h4>
                    </div>
                    <p className="text-sm text-blue-600 mb-3">
                      Ask the customer for their OTP to confirm their arrival and start the parking session.
                    </p>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={verifyingOtp === stableId ? otpInput : ''}
                        onChange={(e) => {
                          if (verifyingOtp === stableId) {
                            setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                          } else {
                            setVerifyingOtp(stableId);
                            setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={6}
                      />
                      <button
                        onClick={() => verifyOtpForBooking(stableId)}
                        disabled={verifyingOtp === stableId && (!otpInput || otpInput.length !== 6)}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center"
                      >
                        {verifyingOtp === stableId && otpInput.length !== 6 ? (
                         "Verifying..." //user input is less than 6 digits
                        ) : (
                          <> 
                          {/* user ne input  */}
                            <Key className="h-4 w-4 mr-2" />
                            Verify OTP
                          </>
                          
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">No bookings match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderBookings;
