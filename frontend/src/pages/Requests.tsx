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
  status?: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled' | 'active';
  user?: { name: string };
  totalPrice?: number;
  paymentStatus?: string;
  otpVerified?: boolean;
  providerId?: string | null;
  availableSpots?: number;
  startedAt?: string | null;
  sessionEndAt?: string | null;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'active' | 'rejected' | 'confirmed' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [verifyingOtp, setVerifyingOtp] = useState<string | null>(null);
  const [secondOtpInput, setSecondOtpInput] = useState('');
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
        setBookings(data || []);
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

  // helper: return true if current time is earlier than (startTime - 1 hour)
  const canRejectBooking = (booking: Booking) => {
    if (!booking.startTime) return true;
    const startTs = new Date(booking.startTime).getTime();
    if (isNaN(startTs)) return true;
    const oneHourBefore = startTs - 60 * 60 * 1000;
    return Date.now() < oneHourBefore;
  };

  // helper: return true if current time is >= booking startTime (OTP entry allowed only after start for buyer)
  const canEnterOtp = (booking: Booking) => {
    if (!booking.startTime) return false;
    const startTs = new Date(booking.startTime).getTime();
    if (isNaN(startTs)) return false;
    return Date.now() >= startTs;
  };

  // friendly countdown text until start
  const timeUntilStartText = (booking: Booking) => {
    if (!booking.startTime) return 'Start time not specified';
    const startTs = new Date(booking.startTime).getTime();
    if (isNaN(startTs)) return 'Start time invalid';
    const diff = startTs - Date.now();
    if (diff <= 0) return 'Starting now';
    const mins = Math.ceil(diff / (60 * 1000));
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} to start`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr${hrs > 1 ? 's' : ''}${remMins > 0 ? ` ${remMins} min` : ''} to start`;
  };

  // Verify OTP function — seller uses this to confirm/confirm/start bookings (used when status is 'accepted')
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
        setVerifyingOtp(null);
        return;
      }

      // Use backend-returned booking status if provided; otherwise fallbacks:
      setBookings(prev => prev.map(b => {
        if ((b._id === bookingId || b.id === bookingId)) {
          const backendStatus = data.booking?.status;
          if (backendStatus) {
            return { ...(b as any), status: backendStatus, otpVerified: true };
          }
          // fallback: if it was accepted, now mark confirmed/active depending on backend assumptions
          return { ...(b as any), status: 'confirmed', otpVerified: true };
        }
        return b;
      }));

      alert('OTP verified — booking updated!');
      setOtpInput('');
      setVerifyingOtp(null);
    } catch (err) {
      console.error('verify OTP error', err);
      alert('Error verifying OTP');
      setVerifyingOtp(null);
    }
  };

  // SECOND OTP: seller uses this to complete a currently active session
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
        setVerifyingSecondOtp(null);
        return;
      }

      // Update booking in-place with whatever backend returned (or at least mark completed)
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
      setVerifyingSecondOtp(null);
    } catch (err) {
      console.error("verifySecondOtpForBooking error:", err);
      alert("Failed to verify second OTP");
      setVerifyingSecondOtp(null);
    }
  };

  const handleReject = (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId || b.id === bookingId);
    if (!booking) {
      alert('Booking not found.');
      return;
    }

    if (!canRejectBooking(booking)) {
      alert('You can only reject a booking earlier than 1 hour before the start time.');
      return;
    }

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

      const booking = bookings.find(b => b._id === selectedBooking || b.id === selectedBooking);
      if (booking && !canRejectBooking(booking)) {
        alert('Cannot reject — booking is within 1 hour of start time.');
        setSelectedBooking(null);
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

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'active': return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      default: return <Clock3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />;
    }
  };

  const getStatusBgColor = (status: string | undefined) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 dark:bg-green-900/20';
      case 'rejected': return 'bg-red-50 dark:bg-red-900/20';
      case 'confirmed': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'active': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'completed': return 'bg-gray-50 dark:bg-gray-900/10';
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
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
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
                    <p className={`text-sm font-medium ${booking.status === 'accepted' ? 'text-green-600' : booking.status === 'rejected' ? 'text-red-600' : booking.status === 'confirmed' ? 'text-blue-600' : booking.status === 'active' ? 'text-yellow-600' : booking.status === 'completed' ? 'text-gray-600' : 'text-yellow-600'}`}>
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
                          className={`px-4 py-2 rounded-lg text-white ${canRejectBooking(booking) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
                          disabled={!canRejectBooking(booking)}
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
                          onClick={() => handleReject(booking._id || booking.id)}
                          disabled={!canRejectBooking(booking)}
                          title={!canRejectBooking(booking) ? 'Cannot reject within 1 hour of start time' : 'Reject booking'}
                          className={`flex-1 ${canRejectBooking(booking) ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} px-4 py-2 rounded-lg transition-colors duration-200`}
                        >
                          {canRejectBooking(booking) ? 'Reject' : 'Reject (locked)'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Verification section for accepted bookings (existing flow) */}
                {booking.paymentStatus === 'paid' && booking.status === 'accepted' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                    {canEnterOtp(booking) ? (
                      <div>
                        <div className="flex items-center mb-3">
                          <Key className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="text-sm font-semibold text-blue-800">OTP Verification</h4>
                        </div>
                        <p className="text-sm text-blue-600 mb-3">
                          Ask the customer for their OTP to confirm their arrival and start the session.
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
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 border-yellow-100">
                        <div className="flex items-center mb-2">
                          <Key className="h-5 w-5 text-yellow-700 mr-2" />
                          <h4 className="text-sm font-semibold text-yellow-800">OTP locked until start time</h4>
                        </div>
                        <p className="text-sm text-yellow-700">
                          OTP entry is allowed only after the booking start time. {timeUntilStartText(booking)}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* SECOND OTP: only show for ACTIVE bookings (seller completes session) */}
                {booking.status === 'active' && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-3">
                      <Key className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-sm font-semibold text-green-800">End Session - Second OTP</h4>
                    </div>
                    <p className="text-sm text-green-600 mb-3">
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
                        className="flex-1 px-3 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxLength={6}
                      />
                      <button
                        onClick={() => verifySecondOtpForBooking(stableId)}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors duration-200 flex items-center"
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
