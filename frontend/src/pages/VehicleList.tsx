import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingScreen from './LoadingScreen';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Booking {
  _id: string;
  user?: { name?: string };
  customerName?: string;
  serviceName?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  totalPrice?: number;
  status?: 'pending' | 'accepted' | 'rejected' | string;
  parkingSpace?: any;
}

const ProviderBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const socket = useSocket();
  const API_BASE = import.meta.env.VITE_BASE_URL;

  // -------------------------------
  // Fetch bookings from API
  // -------------------------------
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/booking/provider-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Status change handler
  // -------------------------------
  const handleStatusChange = async (_id: string, newStatus: string) => {
    try {
      setActionLoading(_id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/booking/${_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setBookings(prev => prev.map(b => b._id === _id ? { ...b, status: newStatus } : b));
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  // -------------------------------
  // Reject booking handler
  // -------------------------------
  const onRejectBooking = async (_id: string, reason: string) => {
    try {
      setActionLoading(_id);
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/booking/reject/${_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      setBookings(prev => prev.map(b => b._id === _id ? { ...b, status: 'rejected' } : b));
      toast.success('Booking rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject booking');
    } finally {
      setActionLoading(null);
      setSelectedBooking(null);
      setRejectReason('');
    }
  };

  const handleRejectClick = (_id: string) => {
    setSelectedBooking(_id);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (selectedBooking && rejectReason.trim()) {
      onRejectBooking(selectedBooking, rejectReason.trim());
    } else {
      toast.error('Please provide a reason for rejection');
    }
  };

  // -------------------------------
  // Booking filtering
  // -------------------------------
  const filteredBookings = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);

    return bookings.filter(b => {
      const name = b.user?.name?.toLowerCase() || '';
      const service = b.serviceName?.toLowerCase() || '';
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || service.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

      let matchesDate = true;
      if (b.startTime) {
        const bookingDate = new Date(b.startTime);
        if (dateFilter === 'today') {
          matchesDate = bookingDate >= startOfToday && bookingDate <= endOfToday;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 7);
          matchesDate = bookingDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(); monthAgo.setMonth(today.getMonth() - 1);
          matchesDate = bookingDate >= monthAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  // -------------------------------
  // Discount & total calculations
  // -------------------------------
  const safeNumber = (v: any) => Number.isFinite(Number(v)) ? Number(v) : 0;

  const detectDiscountPercentFromSpace = (space: any) => {
    if (!space) return 0;
    let raw = space.discount ?? space.discountPercent ?? space.discount_percentage ?? 0;
    if (typeof raw === 'string') raw = raw.replace('%', '');
    if (typeof raw === 'object' && raw !== null) raw = raw.percent ?? raw.value ?? raw.amount ?? 0;
    const num = safeNumber(raw);
    return Math.max(0, Math.min(100, num));
  };

  const computeTotalsForBooking = (b: Booking) => {
    const originalTotal = b.totalPrice != null ? safeNumber(b.totalPrice) : safeNumber(b.price);
    const discountPercent = detectDiscountPercentFromSpace(b.parkingSpace);
    const discountedTotal = Math.max(0, +(originalTotal * (1 - discountPercent / 100)));
    return {
      originalTotal: +originalTotal.toFixed(2),
      discountedTotal: +discountedTotal.toFixed(2),
      discountPercent,
      hasDiscount: discountPercent > 0
    };
  };

  // -------------------------------
  // Socket events
  // -------------------------------
  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleParkingUpdate = (data: any) => {
      const parkingId = data.parkingId || data._id || data.id;
      const availableSpots = typeof data.availableSpots === 'number' ? data.availableSpots : data.available || data.availableSpots;
      if (!parkingId || typeof availableSpots !== 'number') return;

      setBookings(prev =>
        prev.map(b => {
          const ps = b.parkingSpace;
          const pid = ps?._id || ps?.id;
          if (pid && String(pid) === String(parkingId)) {
            return { ...b, parkingSpace: { ...ps, availableSpots } };
          }
          return b;
        })
      );
    };

    const handleBookingEvent = () => fetchBookings();

    socket.on('parking-updated', handleParkingUpdate);
    socket.on('parking-released', handleParkingUpdate);
    socket.on('booking-confirmed', handleBookingEvent);
    socket.on('booking-completed', handleBookingEvent);

    return () => {
      socket.off('parking-updated', handleParkingUpdate);
      socket.off('parking-released', handleParkingUpdate);
      socket.off('booking-confirmed', handleBookingEvent);
      socket.off('booking-completed', handleBookingEvent);
    };
  }, [socket]);

  if (loading) return <div className="h-[calc(100vh-64px)] flex items-center justify-center"><LoadingScreen/></div>;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock3 className="h-5 w-5 text-primary-600" />;
    }
  };

  const getStatusBgColor = (status?: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-50';
      case 'rejected': return 'bg-red-50';
      default: return 'bg-primary-50';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 mx-auto">
      <div className="max-w-fit mx-auto p-4 sm:p-6 lg:p-8">
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
          {filteredBookings.map(b => {
            const totals = computeTotalsForBooking(b);
            return (
              <motion.div key={b._id} layout className="p-6 border rounded-xl">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getStatusBgColor(b.status)} mr-4`}>
                    {getStatusIcon(b.status)}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{b.user?.name ?? b.customerName ?? 'Unknown'}</h3>
                        <p className="text-sm text-gray-500">{b.serviceName}</p>
                        <p className="text-sm text-gray-500"><Calendar className="inline-block w-4 h-4 mr-2" /> {b.startTime ? new Date(b.startTime).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-sm text-gray-500"><Clock className="inline-block w-4 h-4 mr-2" /> {b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Price</p>
                        {totals.hasDiscount ? (
                          <div className="mt-1">
                            <div className="text-sm text-gray-400 line-through">₹{totals.originalTotal.toFixed(2)}</div>
                            <div className="text-lg font-semibold text-green-700">₹{totals.discountedTotal.toFixed(2)}</div>
                            <div className="mt-1 text-xs inline-block bg-green-500 text-white px-2 py-0.5 rounded">{totals.discountPercent}% OFF</div>
                          </div>
                        ) : (
                          <div className="mt-1 text-lg font-semibold">₹{totals.originalTotal.toFixed(2)}</div>
                        )}
                        <p className={`text-sm font-medium mt-2 ${b.status === 'accepted' ? 'text-green-600' : b.status === 'rejected' ? 'text-red-600' : 'text-gray-600'}`}>
                          {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {b.status === 'pending' && (
                      <div className="mt-4 flex space-x-3">
                        {selectedBooking === b._id ? (
                          <>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                            <button
                              onClick={confirmReject}
                              disabled={actionLoading === b._id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg"
                            >
                              {actionLoading === b._id ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStatusChange(b._id, 'accepted')}
                              disabled={actionLoading === b._id}
                              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              {actionLoading === b._id ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleRejectClick(b._id)}
                              disabled={actionLoading === b._id}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProviderBookings;
