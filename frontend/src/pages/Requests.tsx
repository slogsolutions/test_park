import React, { useEffect, useState } from 'react';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  CalendarDays,
  Key,
  Search,
  Filter,
  DollarSign
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
  status?: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'active' | 'completed';
  user?: { name: string };
  totalPrice?: number;
  paymentStatus?: string;
  otpVerified?: boolean;
  providerId?: string | null;
  sessionEndAt?: string | null;
  startedAt?: string | null;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'active' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'specific'>('all');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [verifyingOtp, setVerifyingOtp] = useState<string | null>(null);
  const [secondOtpInput, setSecondOtpInput] = useState("");
  const [verifyingSecondOtp, setVerifyingSecondOtp] = useState<string | null>(null);

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
        const list = data.bookings || data;
        
        // Sort bookings by startTime in descending order (latest first)
        const sortedBookings = list.sort((a: Booking, b: Booking) => {
          const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return timeB - timeA;
        });
        
        setBookings(sortedBookings);
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
      const returned = data.booking || data;
      setBookings(prev => prev.map(booking => 
        (booking._id === bookingId || booking.id === bookingId) 
          ? { ...booking, status: 'confirmed', otpVerified: true, startedAt: returned?.startedAt || new Date().toISOString(), sessionEndAt: returned?.sessionEndAt || null } 
          : booking
      ));
      
      setOtpInput('');
      setVerifyingOtp(null);
    } catch (err) {
      console.error('verify OTP error', err);
      alert('Error verifying OTP');
    } finally {
      setVerifyingOtp(null);
    }
  };

  const verifySecondOtpForBooking = async (bookingId: string) => {
    if (!secondOtpInput.trim() || secondOtpInput.length !== 6) {
      alert("Please enter a valid 6-digit second OTP");
      return;
    }
    
    setVerifyingSecondOtp(bookingId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/verify-second-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: secondOtpInput }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.message || "Failed to verify second OTP"}`);
        return;
      }
      
      const returned = data.booking || data;
      setBookings(prev => prev.map((b: any) => {
        const stable = b._id || b.id;
        if (stable === bookingId) {
          return { ...b, ...(returned || {}), status: 'completed' };
        }
        return b;
      }));

      alert("Parking session completed!");
      setSecondOtpInput("");
    } catch (err) {
      console.error("verifySecondOtpForBooking error:", err);
      alert("Failed to verify second OTP");
    } finally {
      setVerifyingSecondOtp(null);
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
      const matchesPayment = paymentFilter === "all" || booking.paymentStatus === paymentFilter;
  
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
        } else if (dateFilter === "specific" && specificDate) {
          matchesDate = bookingDate.toISOString().split('T')[0] === specificDate;
        }
      }
  
      return matchesSearch && matchesStatus && matchesDate && matchesPayment;
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
      case 'completed': return 'bg-gray-50 dark:bg-gray-900/20';
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
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarDays className="h-7 w-7 text-primary-500 mr-3" />
            Provider Requests
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track all your parking bookings in one place
          </p>
        </div>

        {/* Enhanced Filters Section */}
        <div className="mb-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)} 
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Filter */}
            <div className="flex flex-col space-y-2">
              <select 
                value={dateFilter} 
                onChange={(e) => {
                  setDateFilter(e.target.value as any);
                  if (e.target.value !== 'specific') {
                    setSpecificDate('');
                  }
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="specific">Specific Date</option>
              </select>
              
              {dateFilter === 'specific' && (
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Payment Filter */}
            <select 
              value={paymentFilter} 
              onChange={(e) => setPaymentFilter(e.target.value as any)} 
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1.5 hover:text-primary-600">×</button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')} className="ml-1.5 hover:text-blue-600">×</button>
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Date: {dateFilter === 'specific' ? specificDate : dateFilter}
                <button onClick={() => {
                  setDateFilter('all');
                  setSpecificDate('');
                }} className="ml-1.5 hover:text-green-600">×</button>
              </span>
            )}
            {paymentFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Payment: {paymentFilter}
                <button onClick={() => setPaymentFilter('all')} className="ml-1.5 hover:text-purple-600">×</button>
              </span>
            )}
          </div>
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => {
            const stableId = booking._id || booking.id;
            return (
              <motion.div 
                key={stableId} 
                layout 
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${getStatusBgColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.user?.name || booking.customerName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{booking.serviceName}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          {booking.startTime ? new Date(booking.startTime).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          {booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{booking.totalPrice ? Math.ceil(booking.totalPrice) : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === 'accepted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : booking.status === 'rejected' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : booking.status === 'confirmed' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : booking.status === 'completed' 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {booking.status ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1)) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons - show different options based on status and payment */}
                {booking.status === 'pending' && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {selectedBooking === stableId ? (
                      <div className="flex flex-col space-y-3">
                        <textarea
                          value={rejectReasons[stableId] || ""}
                          onChange={(e) => setRejectReasons(prev => ({ ...prev, [stableId]: e.target.value }))}
                          placeholder="Please provide a reason for rejection..."
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex space-x-3">
                          <button 
                            onClick={confirmReject} 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                          >
                            Confirm Rejection
                          </button>
                          <button 
                            onClick={() => setSelectedBooking(null)} 
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleStatusChange(booking._id, 'accepted')} 
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Accept Booking
                        </button>
                        <button 
                          onClick={() => handleReject(stableId)} 
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Reject Booking
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Verification section - only show for paid bookings that are accepted */}
                {booking.paymentStatus === 'paid' && booking.status === 'accepted' && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-3">
                        <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">OTP Verification Required</h4>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
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
                          className="flex-1 px-4 py-2.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={6}
                        />
                        <button
                          onClick={() => verifyOtpForBooking(stableId)}
                          disabled={verifyingOtp === stableId && otpInput.length !== 6}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium flex items-center"
                        >
                          {verifyingOtp === stableId ? (
                            "Verifying..."
                          ) : (
                            <> 
                              <Key className="h-4 w-4 mr-2" />
                              Verify OTP
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Second OTP Verification - shown when booking is active */}
                {booking.status === 'active' && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center mb-3">
                        <Key className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">End Session - Second OTP</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                        When the customer is leaving, ask them for their second OTP to complete and close the booking.
                      </p>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Enter 6-digit second OTP"
                          value={verifyingSecondOtp === stableId ? secondOtpInput : ''}
                          onChange={(e) => {
                            if (verifyingSecondOtp === stableId) {
                              setSecondOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                            } else {
                              setVerifyingSecondOtp(stableId);
                              setSecondOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                            }
                          }}
                          className="flex-1 px-4 py-2.5 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          maxLength={6}
                        />
                        <button
                          onClick={() => verifySecondOtpForBooking(stableId)}
                          disabled={verifyingSecondOtp === stableId && secondOtpInput.length !== 6}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium flex items-center"
                        >
                          {verifyingSecondOtp === stableId ? (
                            "Completing..."
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Complete Session
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No bookings found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' || paymentFilter !== 'all' 
                ? "No bookings match your current filters. Try adjusting your search or filters."
                : "You don't have any bookings yet. They will appear here when customers book your parking spaces."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderBookings;