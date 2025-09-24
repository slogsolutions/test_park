import React, { useEffect, useState } from 'react';
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

interface Booking {
  id: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected';
  user?: { name: string };
  totalPrice?: number;
  _id?: string;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  // Changed: per-booking reasons map instead of a single shared string
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

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

      setBookings((prevBookings: any) =>
        prevBookings.map((booking: any) =>
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
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
      await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/reject/${bookingId}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      // Update local state robustly: check both _id and id
      setBookings(prev => prev.map(booking => (booking._id === bookingId || booking.id === bookingId) ? { ...booking, status: 'rejected' } : booking));
    } catch (error) {
      console.error('Failed to reject booking', error);
    }
  };

  // handleReject now initialises selectedBooking id and clears the specific reason entry
  const handleReject = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setRejectReasons((prev) => ({ ...prev, [bookingId]: '' }));
  };

  // confirmReject now uses selectedBooking and the per-booking reason
  const confirmReject = () => {
    if (selectedBooking) {
      const reason = (rejectReasons[selectedBooking] || '').trim();
      if (!reason) {
        alert('Please provide a reason before rejecting.');
        return;
      }
      onRejectBooking(selectedBooking, reason);
      // clear selected and the stored reason
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
          </select>
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {filteredBookings.map((booking:any) => {
            // determine a stable id used by this UI for lookups
            const stableId = booking._id || booking.id;
            return (
              <motion.div key={booking.id} layout className="p-6 border rounded-xl">
                <div className={`p-2 rounded-lg ${getStatusBgColor(booking.status)} mr-4`}>
                  {getStatusIcon(booking.status)}
                </div>
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{booking.user?.name || booking.customerName}</h3>
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
                    {selectedBooking === stableId ? (
                      <>
                        {/* Use per-booking reason state and update only that entry */}
                        <textarea
                          value={rejectReasons[stableId] || ""}
                          onChange={(e) => setRejectReasons(prev => ({ ...prev, [stableId]: e.target.value }))}
                          placeholder="Reason for rejection..."
                          className="w-full px-4 py-2 border rounded-lg"
                        ></textarea>
                        <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleStatusChange(booking._id, 'accepted')} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">Accept</button>
                        {/* Pass stableId to ensure selectedBooking matches what we use elsewhere */}
                        <button onClick={() => handleReject(stableId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">Reject</button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProviderBookings;
